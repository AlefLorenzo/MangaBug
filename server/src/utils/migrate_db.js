import pool from '../config/db.js';

const migrate = async () => {
    const connection = await pool.getConnection();
    try {
        console.log('🚀 Starting Master Schema Migration...');
        await connection.beginTransaction();

        // 1. Rename 'mangas' to 'works' if it exists
        const [mangasTable] = await connection.query("SHOW TABLES LIKE 'mangas'");
        if (mangasTable.length > 0) {
            console.log('📦 Renaming mangas to works...');
            await connection.query('RENAME TABLE mangas TO works');
        }

        // 2. Rename 'reading_progress' to 'reading_history' if it exists
        const [progressTable] = await connection.query("SHOW TABLES LIKE 'reading_progress'");
        if (progressTable.length > 0) {
            console.log('📖 Renaming reading_progress to reading_history...');
            await connection.query('RENAME TABLE reading_progress TO reading_history');
        }

        // 3. Create 'tags' table
        console.log('🏷️ Creating tags and work_tags tables...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tags (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                slug VARCHAR(50) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Create 'work_tags' junction table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS work_tags (
                work_id INT NOT NULL,
                tag_id INT NOT NULL,
                PRIMARY KEY (work_id, tag_id),
                FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 5. Create 'banner_buttons' table
        console.log('🔘 Creating banner_buttons table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS banner_buttons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                banner_id INT NOT NULL,
                label VARCHAR(50) NOT NULL,
                action_type ENUM('work', 'chapter', 'url') NOT NULL,
                action_value TEXT NOT NULL,
                style_attr TEXT,
                display_order INT DEFAULT 0,
                FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 6. Create 'ratings' table
        console.log('⭐ Creating ratings table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                work_id INT NOT NULL,
                rating DECIMAL(3,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY user_work (user_id, work_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 7. Create 'chapter_images' table (for professional granularity)
        console.log('🖼️ Creating chapter_images table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chapter_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chapter_id INT NOT NULL,
                image_url TEXT NOT NULL,
                page_number INT NOT NULL,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
                INDEX (chapter_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 8. Add status and views to works if not present (Migration safety)
        await connection.query(`
            ALTER TABLE works 
            MODIFY COLUMN title VARCHAR(255) NOT NULL,
            ADD COLUMN IF NOT EXISTS author VARCHAR(255),
            ADD COLUMN IF NOT EXISTS artist VARCHAR(255),
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em andamento',
            ADD COLUMN IF NOT EXISTS rating_cache DECIMAL(3,2) DEFAULT 4.5
        `);

        await connection.commit();
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        await connection.rollback();
        console.error('❌ Migration FAILED:', error);
    } finally {
        connection.release();
        process.exit();
    }
};

migrate();
