/**
 * Seed Users - Create family members and roles
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Family members and roles
const users = [
    { user_id: 'seven', name: 'Seven', role: 'student', avatar_color: '#58a6ff' },
    { user_id: 'alya', name: 'Alya', role: 'student', avatar_color: '#f778ba' },
    { user_id: 'skye', name: 'Skye', role: 'student', avatar_color: '#3fb950' },
    { user_id: 'nova', name: 'Nova', role: 'student', avatar_color: '#a371f7' },
    { user_id: 'truth', name: 'Truth', role: 'student', avatar_color: '#f0883e' },
    { user_id: 'admin', name: 'Admin', role: 'admin', avatar_color: '#f85149' },
    { user_id: 'teacher', name: 'Teacher', role: 'teacher', avatar_color: '#79c0ff' }
];

async function seedUsers() {
    console.log('👨‍👩‍👧‍👦 Seeding users...\n');

    try {
        // Create users table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'student',
                avatar_color VARCHAR(20) DEFAULT '#58a6ff',
                email VARCHAR(200),
                grade_level VARCHAR(10),
                parent_email VARCHAR(200),
                created_at TIMESTAMP DEFAULT NOW(),
                last_active TIMESTAMP DEFAULT NOW()
            )
        `);

        // Insert users
        for (const user of users) {
            await pool.query(`
                INSERT INTO users (user_id, name, role, avatar_color)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET
                    name = $2,
                    role = $3,
                    avatar_color = $4
            `, [user.user_id, user.name, user.role, user.avatar_color]);
            
            const emoji = user.role === 'admin' ? '👑' : user.role === 'teacher' ? '📚' : '🎓';
            console.log(`   ${emoji} ${user.name} (${user.role})`);
        }

        console.log('\n✅ Users seeded successfully!');
        console.log('\n📊 Access URLs:');
        users.forEach(u => {
            console.log(`   ${u.name}: /?student=${u.user_id}`);
        });

    } catch (error) {
        console.error('❌ Error seeding users:', error);
    } finally {
        await pool.end();
    }
}

seedUsers();

