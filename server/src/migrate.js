import pool from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    console.log('🔧 Running database migration...\n');
    const connection = await pool.getConnection();

    try {
        // Check what tables exist
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('📋 Existing tables:', tableNames.join(', '));

        // Create 'works' table if it doesn't exist
        if (!tableNames.includes('works') && tableNames.includes('mangas')) {
            console.log('\n🔄 Renaming `mangas` → `works`...');
            await connection.query('RENAME TABLE mangas TO works');
            console.log('✅ Done!');
        } else if (!tableNames.includes('works') && !tableNames.includes('mangas')) {
            console.log('\n📝 Creating `works` table from scratch...');
            await connection.query(`
                CREATE TABLE works (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    original_title VARCHAR(255),
                    description TEXT,
                    author VARCHAR(255),
                    artist VARCHAR(255),
                    cover_url VARCHAR(500),
                    type ENUM('manga', 'manhwa', 'manhua', 'novel', 'comic') DEFAULT 'manga',
                    status ENUM('ongoing', 'completed', 'hiatus', 'cancelled') DEFAULT 'ongoing',
                    tags JSON,
                    rating_cache DECIMAL(3,1) DEFAULT 0,
                    views INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Done!');
        } else {
            console.log('\n✅ `works` table already exists.');
        }

        // Update foreign keys: chapters, favorites, reading_history → work_id
        // Check if chapters table references manga_id or work_id
        const [chapterCols] = await connection.query("SHOW COLUMNS FROM chapters LIKE 'manga_id'");
        if (chapterCols.length > 0) {
            console.log('\n🔄 Renaming `chapters.manga_id` → `chapters.work_id`...');
            await connection.query('ALTER TABLE chapters CHANGE COLUMN manga_id work_id INT');
            console.log('✅ Done!');
        }

        // Check admin user existence
        const [admins] = await connection.query('SELECT id, username, email FROM users WHERE is_admin = 1');
        if (admins.length > 0) {
            console.log('\n👑 Admin users found:', admins.map(a => `${a.username} (${a.email})`).join(', '));
        } else {
            console.log('\n⚠️ No admin users found!');
        }

        // Ensure required tables exist
        const requiredTables = ['users', 'chapters', 'favorites', 'reading_history', 'ratings', 'xp_logs', 'banners'];
        for (const table of requiredTables) {
            if (!tableNames.includes(table)) {
                console.log(`⚠️ Missing table: ${table}`);
            }
        }

        // Ensure chapter_images table exists (for reader)
        if (!tableNames.includes('chapter_images')) {
            console.log('\n📝 Creating `chapter_images` table...');
            await connection.query(`
                CREATE TABLE IF NOT EXISTS chapter_images (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    chapter_id INT NOT NULL,
                    page_number INT NOT NULL,
                    image_url VARCHAR(500) NOT NULL,
                    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ Done!');
        }

        console.log('\n🎉 Migration complete!');
    } catch (error) {
        console.error('\n❌ Migration Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
