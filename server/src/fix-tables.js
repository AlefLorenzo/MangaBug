import pool from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixMissing() {
    const connection = await pool.getConnection();
    try {
        // Create missing tables
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                work_id INT NOT NULL,
                rating DECIMAL(2,1) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_rating (user_id, work_id)
            )
        `);
        console.log('✅ ratings table ensured');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS xp_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount INT NOT NULL,
                reason VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ xp_logs table ensured');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS banners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                subtitle VARCHAR(500),
                image_url VARCHAR(500),
                work_id INT,
                buttons JSON,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ banners table ensured');

        // Show admin users
        const [admins] = await connection.query('SELECT id, username, email FROM users WHERE is_admin = 1');
        console.log('\n👑 Admin users:');
        admins.forEach(a => console.log(`  - ID:${a.id} | ${a.username} | ${a.email}`));

        console.log('\n🎉 All tables fixed!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

fixMissing();
