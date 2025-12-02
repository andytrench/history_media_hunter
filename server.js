/**
 * Archer's History - Server
 * Express server with PostgreSQL for all curriculum data
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
let pool = null;
let dbReady = false;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('PostgreSQL configured');
}

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname), {
    index: false // Don't auto-serve index.html, we'll handle it
}));

// ===========================================
// API ROUTES - Curriculum Data
// ===========================================

// Health check
app.get('/api/health', async (req, res) => {
    let dbStatus = 'not configured';
    if (pool) {
        try {
            await pool.query('SELECT 1');
            dbStatus = 'connected';
        } catch (e) {
            dbStatus = 'error: ' + e.message;
        }
    }
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: dbStatus
    });
});

// Get all grades
app.get('/api/grades', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const result = await pool.query(`
            SELECT g.*, 
                   COUNT(DISTINCT c.id) as category_count,
                   COUNT(DISTINCT m.id) as media_count
            FROM grades g
            LEFT JOIN categories c ON c.grade_id = g.id
            LEFT JOIN topics t ON t.category_id = c.id
            LEFT JOIN media m ON m.topic_id = t.id
            GROUP BY g.id
            ORDER BY g.grade_number::int
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ error: 'Failed to fetch grades' });
    }
});

// Get single grade with all data
app.get('/api/grades/:gradeNum', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { gradeNum } = req.params;
        
        // Get grade info
        const gradeResult = await pool.query(
            'SELECT * FROM grades WHERE grade_number = $1',
            [gradeNum]
        );
        
        if (gradeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Grade not found' });
        }
        
        const grade = gradeResult.rows[0];
        
        // Get categories with topics and media
        const categoriesResult = await pool.query(`
            SELECT c.id, c.slug, c.name, c.description, c.sort_order,
                   json_agg(
                       json_build_object(
                           'id', t.slug,
                           'name', t.name,
                           'description', t.description,
                           'order', t.sort_order,
                           'subtopics', (
                               SELECT array_agg(s.name ORDER BY s.sort_order)
                               FROM subtopics s WHERE s.topic_id = t.id
                           ),
                           'media', (
                               SELECT json_agg(
                                   json_build_object(
                                       'id', m.id,
                                       'title', m.title,
                                       'type', m.type,
                                       'year', m.year,
                                       'rating', m.rating,
                                       'runtime', m.runtime,
                                       'relevance', m.relevance,
                                       'notes', m.notes,
                                       'ageAppropriate', m.age_appropriate,
                                       'contentType', m.content_type,
                                       'disabled', COALESCE(m.disabled, false),
                                       'links', m.links,
                                       'lessonPlan', m.lesson_plan
                                   ) ORDER BY m.title
                               )
                               FROM media m WHERE m.topic_id = t.id
                           )
                       ) ORDER BY t.sort_order
                   ) FILTER (WHERE t.id IS NOT NULL) as topics
            FROM categories c
            LEFT JOIN topics t ON t.category_id = c.id
            WHERE c.grade_id = $1
            GROUP BY c.id
            ORDER BY c.sort_order
        `, [grade.id]);
        
        res.json({
            grade: gradeNum,
            name: grade.name,
            curriculumFocus: grade.curriculum_focus,
            lastUpdated: grade.last_updated,
            categories: categoriesResult.rows.map(cat => ({
                id: cat.slug,
                name: cat.name,
                description: cat.description,
                order: cat.sort_order,
                topics: cat.topics || []
            }))
        });
    } catch (error) {
        console.error('Error fetching grade:', error);
        res.status(500).json({ error: 'Failed to fetch grade data' });
    }
});

// Search media
app.get('/api/search', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { q, grade, type, ageAppropriate } = req.query;
        
        let query = `
            SELECT m.*, t.name as topic_name, t.slug as topic_slug,
                   c.name as category_name, c.slug as category_slug,
                   g.grade_number
            FROM media m
            JOIN topics t ON t.id = m.topic_id
            JOIN categories c ON c.id = t.category_id
            JOIN grades g ON g.id = c.grade_id
            WHERE 1=1
        `;
        const params = [];
        
        if (q) {
            params.push(`%${q}%`);
            query += ` AND (m.title ILIKE $${params.length} OR m.relevance ILIKE $${params.length} OR m.notes ILIKE $${params.length})`;
        }
        
        if (grade) {
            params.push(grade);
            query += ` AND g.grade_number = $${params.length}`;
        }
        
        if (type && type !== 'all') {
            params.push(type);
            query += ` AND m.type = $${params.length}`;
        }
        
        if (ageAppropriate !== undefined && ageAppropriate !== 'all') {
            params.push(ageAppropriate === 'true');
            query += ` AND m.age_appropriate = $${params.length}`;
        }
        
        query += ' ORDER BY m.title LIMIT 100';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get single media item
app.get('/api/media/:id', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const result = await pool.query(`
            SELECT m.*, t.name as topic_name, t.description as topic_description,
                   c.name as category_name, g.grade_number, g.name as grade_name,
                   (SELECT array_agg(s.name ORDER BY s.sort_order) FROM subtopics s WHERE s.topic_id = t.id) as subtopics
            FROM media m
            JOIN topics t ON t.id = m.topic_id
            JOIN categories c ON c.id = t.category_id
            JOIN grades g ON g.id = c.grade_id
            WHERE m.id = $1
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Media not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});

// ===========================================
// API ROUTES - Student Progress
// ===========================================

// Get student progress
app.get('/api/progress/:studentId', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { studentId } = req.params;
        const result = await pool.query(`
            SELECT sp.*, m.title, m.type, g.grade_number
            FROM student_progress sp
            JOIN media m ON m.id = sp.media_id
            JOIN topics t ON t.id = m.topic_id
            JOIN categories c ON c.id = t.category_id
            JOIN grades g ON g.id = c.grade_id
            WHERE sp.student_id = $1
            ORDER BY sp.updated_at DESC
        `, [studentId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// Save watched status
app.post('/api/progress', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { studentId, mediaId, watched, notes, rating } = req.body;
        
        const result = await pool.query(`
            INSERT INTO student_progress (student_id, media_id, watched, notes, rating, watch_date, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (student_id, media_id) 
            DO UPDATE SET 
                watched = $3, 
                notes = COALESCE($4, student_progress.notes),
                rating = COALESCE($5, student_progress.rating),
                watch_date = CASE WHEN $3 = true THEN NOW() ELSE student_progress.watch_date END,
                updated_at = NOW()
            RETURNING *
        `, [studentId, mediaId, watched, notes || null, rating || null, watched ? new Date() : null]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// Bulk mark watched for all students (admin/teacher only)
app.post('/api/progress/bulk', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { mediaId, watched, markedBy } = req.body;
        
        // Get all students
        const studentsResult = await pool.query(
            "SELECT user_id FROM users WHERE role = 'student'"
        );
        
        const students = studentsResult.rows;
        let updated = 0;
        
        // Mark for each student
        for (const student of students) {
            await pool.query(`
                INSERT INTO student_progress (student_id, media_id, watched, watch_date, updated_at, notes)
                VALUES ($1, $2, $3, $4, NOW(), $5)
                ON CONFLICT (student_id, media_id) 
                DO UPDATE SET 
                    watched = $3, 
                    watch_date = CASE WHEN $3 = true THEN NOW() ELSE student_progress.watch_date END,
                    updated_at = NOW(),
                    notes = CASE WHEN $3 = true THEN COALESCE(student_progress.notes || ' ', '') || $5 ELSE student_progress.notes END
            `, [
                student.user_id, 
                mediaId, 
                watched, 
                watched ? new Date() : null,
                watched ? `[Credit given by ${markedBy}]` : null
            ]);
            updated++;
        }
        
        res.json({ 
            success: true, 
            studentsUpdated: updated,
            mediaId: mediaId,
            watched: watched 
        });
    } catch (error) {
        console.error('Error bulk saving progress:', error);
        res.status(500).json({ error: 'Failed to bulk save progress' });
    }
});

// Get all registered users
app.get('/api/users', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const result = await pool.query(`
            SELECT u.*,
                   COALESCE(progress.watched_count, 0) as watched_count,
                   COALESCE(progress.grades_touched, 0) as grades_touched,
                   progress.last_activity
            FROM users u
            LEFT JOIN (
                SELECT 
                    sp.student_id,
                    COUNT(*) FILTER (WHERE sp.watched = true) as watched_count,
                    COUNT(DISTINCT g.id) as grades_touched,
                    MAX(sp.updated_at) as last_activity
                FROM student_progress sp
                JOIN media m ON m.id = sp.media_id
                JOIN topics t ON t.id = m.topic_id
                JOIN categories c ON c.id = t.category_id
                JOIN grades g ON g.id = c.grade_id
                GROUP BY sp.student_id
            ) progress ON progress.student_id = u.user_id
            ORDER BY u.role, u.name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get single user info
app.get('/api/users/:userId', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_id = $1',
            [req.params.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Get all students with stats (for admin/teacher dashboard)
app.get('/api/students', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const result = await pool.query(`
            SELECT 
                u.user_id as student_id,
                u.name,
                u.avatar_color,
                u.last_active,
                COALESCE(progress.watched_count, 0) as watched_count,
                COALESCE(progress.grades_touched, 0) as grades_touched,
                progress.last_activity,
                progress.recent_titles
            FROM users u
            LEFT JOIN (
                SELECT 
                    sp.student_id,
                    COUNT(*) FILTER (WHERE sp.watched = true) as watched_count,
                    COUNT(DISTINCT g.id) as grades_touched,
                    MAX(sp.updated_at) as last_activity,
                    array_agg(DISTINCT m.title ORDER BY m.title) FILTER (WHERE sp.watched = true) as recent_titles
                FROM student_progress sp
                JOIN media m ON m.id = sp.media_id
                JOIN topics t ON t.id = m.topic_id
                JOIN categories c ON c.id = t.category_id
                JOIN grades g ON g.id = c.grade_id
                GROUP BY sp.student_id
            ) progress ON progress.student_id = u.user_id
            WHERE u.role = 'student'
            ORDER BY u.name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get dashboard data for admin/teacher
app.get('/api/dashboard', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        // Total media count
        const totalMedia = await pool.query('SELECT COUNT(*) FROM media');
        
        // Students with progress
        const studentsResult = await pool.query(`
            SELECT 
                u.user_id,
                u.name,
                u.avatar_color,
                COALESCE(watched.count, 0) as watched_count
            FROM users u
            LEFT JOIN (
                SELECT student_id, COUNT(*) as count 
                FROM student_progress 
                WHERE watched = true 
                GROUP BY student_id
            ) watched ON watched.student_id = u.user_id
            WHERE u.role = 'student'
            ORDER BY u.name
        `);
        
        // Progress by grade for each student
        const gradeProgress = await pool.query(`
            SELECT 
                sp.student_id,
                g.grade_number,
                g.name as grade_name,
                COUNT(*) FILTER (WHERE sp.watched = true) as watched,
                (SELECT COUNT(*) FROM media m2 
                 JOIN topics t2 ON t2.id = m2.topic_id 
                 JOIN categories c2 ON c2.id = t2.category_id 
                 WHERE c2.grade_id = g.id) as total
            FROM grades g
            CROSS JOIN users u
            LEFT JOIN categories c ON c.grade_id = g.id
            LEFT JOIN topics t ON t.category_id = c.id
            LEFT JOIN media m ON m.topic_id = t.id
            LEFT JOIN student_progress sp ON sp.media_id = m.id AND sp.student_id = u.user_id
            WHERE u.role = 'student'
            GROUP BY sp.student_id, g.id, g.grade_number, g.name
            ORDER BY g.grade_number::int
        `);
        
        // Recent activity
        const recentActivity = await pool.query(`
            SELECT 
                u.name as student_name,
                u.avatar_color,
                m.title,
                g.grade_number,
                sp.watch_date
            FROM student_progress sp
            JOIN users u ON u.user_id = sp.student_id
            JOIN media m ON m.id = sp.media_id
            JOIN topics t ON t.id = m.topic_id
            JOIN categories c ON c.id = t.category_id
            JOIN grades g ON g.id = c.grade_id
            WHERE sp.watched = true AND sp.watch_date IS NOT NULL
            ORDER BY sp.watch_date DESC
            LIMIT 20
        `);
        
        res.json({
            totalMedia: parseInt(totalMedia.rows[0].count),
            students: studentsResult.rows,
            gradeProgress: gradeProgress.rows,
            recentActivity: recentActivity.rows
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Register/update student
app.post('/api/students', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { studentId, name, email, gradeLevel, parentEmail } = req.body;
        
        const result = await pool.query(`
            INSERT INTO students (student_id, name, email, grade_level, parent_email)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (student_id) 
            DO UPDATE SET 
                name = COALESCE($2, students.name),
                email = COALESCE($3, students.email),
                grade_level = COALESCE($4, students.grade_level),
                parent_email = COALESCE($5, students.parent_email)
            RETURNING *
        `, [studentId, name, email || null, gradeLevel || null, parentEmail || null]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving student:', error);
        res.status(500).json({ error: 'Failed to save student' });
    }
});

// Get student stats by grade
app.get('/api/stats/:studentId', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { studentId } = req.params;
        const result = await pool.query(`
            SELECT 
                g.grade_number,
                g.name as grade_name,
                COUNT(*) FILTER (WHERE sp.watched = true) as watched_count,
                (SELECT COUNT(*) FROM media m2 
                 JOIN topics t2 ON t2.id = m2.topic_id 
                 JOIN categories c2 ON c2.id = t2.category_id 
                 WHERE c2.grade_id = g.id) as total_media
            FROM grades g
            LEFT JOIN categories c ON c.grade_id = g.id
            LEFT JOIN topics t ON t.category_id = c.id
            LEFT JOIN media m ON m.topic_id = t.id
            LEFT JOIN student_progress sp ON sp.media_id = m.id AND sp.student_id = $1
            GROUP BY g.id, g.grade_number, g.name
            ORDER BY g.grade_number::int
        `, [studentId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ===========================================
// API ROUTES - Media Reports
// ===========================================

// Submit a report
app.post('/api/reports', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { mediaId, reporterId, reporterName, reportType, notes } = req.body;
        
        // Create the report
        const result = await pool.query(`
            INSERT INTO media_reports (media_id, reporter_id, reporter_name, report_type, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [mediaId, reporterId, reporterName || null, reportType, notes || null]);
        
        // Disable the media for students
        await pool.query('UPDATE media SET disabled = true WHERE id = $1', [mediaId]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
});

// Get all reports (for admin/teacher)
app.get('/api/reports', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { status } = req.query;
        let query = `
            SELECT r.*, m.title as media_title, m.type as media_type,
                   t.name as topic_name, c.name as category_name, g.grade_number
            FROM media_reports r
            JOIN media m ON m.id = r.media_id
            JOIN topics t ON t.id = m.topic_id
            JOIN categories c ON c.id = t.category_id
            JOIN grades g ON g.id = c.grade_id
        `;
        
        if (status) {
            query += ` WHERE r.status = $1`;
            query += ` ORDER BY r.created_at DESC`;
            const result = await pool.query(query, [status]);
            res.json(result.rows);
        } else {
            query += ` ORDER BY r.created_at DESC`;
            const result = await pool.query(query);
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Resolve a report
app.patch('/api/reports/:id', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const { id } = req.params;
        const { status, resolvedBy, reenableMedia } = req.body;
        
        const result = await pool.query(`
            UPDATE media_reports 
            SET status = $1, resolved_by = $2, resolved_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [status, resolvedBy, id]);
        
        // Optionally re-enable the media
        if (reenableMedia && result.rows[0]) {
            await pool.query('UPDATE media SET disabled = false WHERE id = $1', [result.rows[0].media_id]);
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

// Get disabled media list
app.get('/api/media/disabled', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const result = await pool.query(`
            SELECT m.id, m.title, m.type, m.disabled,
                   t.name as topic_name, c.name as category_name, g.grade_number,
                   (SELECT COUNT(*) FROM media_reports r WHERE r.media_id = m.id) as report_count
            FROM media m
            JOIN topics t ON t.id = m.topic_id
            JOIN categories c ON c.id = t.category_id
            JOIN grades g ON g.id = c.grade_id
            WHERE m.disabled = true
            ORDER BY m.title
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching disabled media:', error);
        res.status(500).json({ error: 'Failed to fetch disabled media' });
    }
});

// Export reports as text (for AI processing)
app.get('/api/reports/export', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    try {
        const result = await pool.query(`
            SELECT r.*, m.title as media_title, m.type as media_type, m.year,
                   m.relevance, m.notes as media_notes,
                   t.name as topic_name, c.name as category_name, g.grade_number
            FROM media_reports r
            JOIN media m ON m.id = r.media_id
            JOIN topics t ON t.id = m.topic_id
            JOIN categories c ON c.id = t.category_id
            JOIN grades g ON g.id = c.grade_id
            WHERE r.status = 'pending'
            ORDER BY g.grade_number, c.name, r.created_at
        `);
        
        // Format as text for AI processing
        let text = "=== MEDIA REPORTS FOR REVIEW ===\n";
        text += `Generated: ${new Date().toISOString()}\n`;
        text += `Total Pending Reports: ${result.rows.length}\n\n`;
        
        result.rows.forEach((r, i) => {
            text += `--- REPORT ${i + 1} ---\n`;
            text += `Media ID: ${r.media_id}\n`;
            text += `Title: ${r.media_title} (${r.year || 'N/A'})\n`;
            text += `Type: ${r.media_type}\n`;
            text += `Grade: ${r.grade_number}\n`;
            text += `Category: ${r.category_name}\n`;
            text += `Topic: ${r.topic_name}\n`;
            text += `Current Relevance: ${r.relevance || 'N/A'}\n`;
            text += `Current Notes: ${r.media_notes || 'N/A'}\n`;
            text += `\n`;
            text += `Report Type: ${r.report_type}\n`;
            text += `Reporter: ${r.reporter_name || r.reporter_id}\n`;
            text += `Reporter Notes: ${r.notes || 'No notes provided'}\n`;
            text += `Reported At: ${r.created_at}\n`;
            text += `\n\n`;
        });
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename=media-reports.txt');
        res.send(text);
    } catch (error) {
        console.error('Error exporting reports:', error);
        res.status(500).json({ error: 'Failed to export reports' });
    }
});

// ===========================================
// Serve Frontend
// ===========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('*', (req, res) => {
    // If it's an API route that doesn't exist
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Otherwise serve the frontend
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===========================================
// Database Initialization
// ===========================================

async function initDatabase() {
    if (!pool) {
        console.log('⚠️  No database configured - running without persistence');
        console.log('   Set DATABASE_URL to enable database features');
        return;
    }
    
    try {
        // Create tables if they don't exist
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schema);
            console.log('✅ Database schema ready');
        }
        
        // Check if we have data
        const mediaCount = await pool.query('SELECT COUNT(*) FROM media');
        if (parseInt(mediaCount.rows[0].count) === 0) {
            console.log('⚠️  Database is empty. Run: node database/seed.js');
        } else {
            console.log(`✅ Database has ${mediaCount.rows[0].count} media items`);
        }
        
        dbReady = true;
    } catch (error) {
        console.error('❌ Database init error:', error.message);
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`\n🎬 Archer's History`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    await initDatabase();
    console.log(`\n🌐 Ready at http://localhost:${PORT}\n`);
});
