/**
 * Curriculum Media Hunter - Server
 * Express server for Railway deployment with PostgreSQL support
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection (optional - only if DATABASE_URL is set)
let pool = null;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('PostgreSQL connection configured');
}

// Serve static files
app.use(express.static(path.join(__dirname)));

// API Routes for student progress tracking
// =========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: pool ? 'connected' : 'not configured'
    });
});

// Get student progress
app.get('/api/progress/:studentId', async (req, res) => {
    if (!pool) {
        return res.status(503).json({ error: 'Database not configured' });
    }
    
    try {
        const { studentId } = req.params;
        const result = await pool.query(
            'SELECT * FROM student_progress WHERE student_id = $1',
            [studentId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// Save watched status
app.post('/api/progress', async (req, res) => {
    if (!pool) {
        return res.status(503).json({ error: 'Database not configured' });
    }
    
    try {
        const { studentId, mediaKey, watched, grade } = req.body;
        
        const result = await pool.query(`
            INSERT INTO student_progress (student_id, media_key, watched, grade, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (student_id, media_key) 
            DO UPDATE SET watched = $3, updated_at = NOW()
            RETURNING *
        `, [studentId, mediaKey, watched, grade]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// Get all students (for parent/teacher dashboard)
app.get('/api/students', async (req, res) => {
    if (!pool) {
        return res.status(503).json({ error: 'Database not configured' });
    }
    
    try {
        const result = await pool.query(`
            SELECT DISTINCT student_id, 
                   COUNT(*) FILTER (WHERE watched = true) as watched_count,
                   MAX(updated_at) as last_activity
            FROM student_progress 
            GROUP BY student_id
            ORDER BY last_activity DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get student stats by grade
app.get('/api/stats/:studentId', async (req, res) => {
    if (!pool) {
        return res.status(503).json({ error: 'Database not configured' });
    }
    
    try {
        const { studentId } = req.params;
        const result = await pool.query(`
            SELECT grade, 
                   COUNT(*) FILTER (WHERE watched = true) as watched_count,
                   COUNT(*) as total_interactions
            FROM student_progress 
            WHERE student_id = $1
            GROUP BY grade
            ORDER BY grade
        `, [studentId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Catch-all route - serve index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize database tables if connected
async function initDatabase() {
    if (!pool) {
        console.log('No database configured - running in static mode');
        return;
    }
    
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_progress (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(100) NOT NULL,
                media_key VARCHAR(255) NOT NULL,
                watched BOOLEAN DEFAULT false,
                grade VARCHAR(10),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(student_id, media_key)
            );
            
            CREATE INDEX IF NOT EXISTS idx_student_progress_student 
            ON student_progress(student_id);
            
            CREATE INDEX IF NOT EXISTS idx_student_progress_media 
            ON student_progress(media_key);
        `);
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`🎬 Curriculum Media Hunter running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    await initDatabase();
});

