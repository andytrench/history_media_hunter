/**
 * Seed script - Import all JSON curriculum data into PostgreSQL
 * Run: node database/seed.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Grade configurations
const GRADE_CONFIG = {
    '5': { name: 'Western Hemisphere', focus: 'Geography, history, and cultures of the Western Hemisphere' },
    '7': { name: 'US & NY History', focus: 'United States and New York State history from colonial times through Reconstruction' },
    '9': { name: 'Global History I', focus: 'World history from ancient civilizations through the Renaissance' },
    '10': { name: 'Global History II', focus: 'World history from the Age of Enlightenment to the present' },
    '11': { name: 'US History', focus: 'United States history from colonization through the modern era' }
};

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    try {
        // Run schema first
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schemaSQL);
        console.log('✅ Schema created\n');

        // Clear existing data
        await pool.query('TRUNCATE grades, categories, topics, subtopics, media RESTART IDENTITY CASCADE');
        console.log('✅ Cleared existing data\n');

        // Process each grade
        for (const [gradeNum, config] of Object.entries(GRADE_CONFIG)) {
            await processGrade(gradeNum, config);
        }

        console.log('\n🎉 Database seeded successfully!');
        
        // Print stats
        const stats = await getStats();
        console.log('\n📊 Database Statistics:');
        console.log(`   Grades: ${stats.grades}`);
        console.log(`   Categories: ${stats.categories}`);
        console.log(`   Topics: ${stats.topics}`);
        console.log(`   Media items: ${stats.media}`);

    } catch (error) {
        console.error('❌ Seed error:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

async function processGrade(gradeNum, config) {
    console.log(`📚 Processing Grade ${gradeNum}: ${config.name}`);

    // Insert grade
    const gradeResult = await pool.query(`
        INSERT INTO grades (grade_number, name, curriculum_focus)
        VALUES ($1, $2, $3)
        RETURNING id
    `, [gradeNum, config.name, config.focus]);
    const gradeId = gradeResult.rows[0].id;

    // Load JSON file(s)
    const files = [`grade-${gradeNum}.json`];
    if (gradeNum === '11') {
        files.push('grade-11-part2.json');
    }

    let allCategories = [];
    for (const file of files) {
        const filePath = path.join(__dirname, '..', 'grades', file);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (data.categories) {
                allCategories = allCategories.concat(data.categories);
            }
        }
    }

    let categoryCount = 0;
    let topicCount = 0;
    let mediaCount = 0;

    // Process each category
    for (const category of allCategories) {
        const catResult = await pool.query(`
            INSERT INTO categories (grade_id, slug, name, description, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [gradeId, category.id, category.name, category.description || null, category.order || 0]);
        const categoryId = catResult.rows[0].id;
        categoryCount++;

        // Process topics
        if (category.topics) {
            for (const topic of category.topics) {
                const topicResult = await pool.query(`
                    INSERT INTO topics (category_id, slug, name, description, sort_order)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                `, [categoryId, topic.id, topic.name, topic.description || null, topic.order || 0]);
                const topicId = topicResult.rows[0].id;
                topicCount++;

                // Insert subtopics
                if (topic.subtopics) {
                    for (let i = 0; i < topic.subtopics.length; i++) {
                        await pool.query(`
                            INSERT INTO subtopics (topic_id, name, sort_order)
                            VALUES ($1, $2, $3)
                        `, [topicId, topic.subtopics[i], i]);
                    }
                }

                // Insert media
                if (topic.media) {
                    for (const media of topic.media) {
                        await pool.query(`
                            INSERT INTO media (
                                topic_id, title, type, year, rating, runtime,
                                relevance, notes, age_appropriate, content_type, links, lesson_plan
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        `, [
                            topicId,
                            media.title,
                            media.type || 'movie',
                            media.year || null,
                            media.rating || null,
                            media.runtime || null,
                            media.relevance || null,
                            media.notes || null,
                            media.ageAppropriate !== false,
                            media.contentType || 'entertainment',
                            JSON.stringify(media.links || {}),
                            media.lessonPlan ? JSON.stringify(media.lessonPlan) : null
                        ]);
                        mediaCount++;
                    }
                }
            }
        }
    }

    console.log(`   ✅ ${categoryCount} categories, ${topicCount} topics, ${mediaCount} media items`);
}

async function getStats() {
    const [grades, categories, topics, media] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM grades'),
        pool.query('SELECT COUNT(*) FROM categories'),
        pool.query('SELECT COUNT(*) FROM topics'),
        pool.query('SELECT COUNT(*) FROM media')
    ]);

    return {
        grades: parseInt(grades.rows[0].count),
        categories: parseInt(categories.rows[0].count),
        topics: parseInt(topics.rows[0].count),
        media: parseInt(media.rows[0].count)
    };
}

// Run seed
seedDatabase().catch(console.error);

