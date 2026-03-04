import pool from '../config/db.js';

async function consolidate() {
    console.log('🚀 Starting Database Consolidation...');
    const connection = await pool.getConnection();

    try {
        // 1. Get existing tables
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('📋 Existing tables:', tableNames.join(', '));

        // 2. Handle mangas -> works migration
        if (tableNames.includes('mangas') && !tableNames.includes('works')) {
            console.log('🔄 Renaming `mangas` to `works`...');
            await connection.query('RENAME TABLE mangas TO works');
        } else if (tableNames.includes('mangas') && tableNames.includes('works')) {
            console.log('⚠️ Both `mangas` and `works` exist. Merging data if necessary...');
            // Simple logic: if 'works' is empty, move data from 'mangas'
            const [workCount] = await connection.query('SELECT COUNT(*) as total FROM works');
            if (workCount[0].total === 0) {
                await connection.query('INSERT IGNORE INTO works SELECT * FROM mangas');
                console.log('✅ Data merged from `mangas` into `works`.');
            }
        }

        // 3. Ensure `works` schema is up to date
        if (tableNames.includes('mangas') || tableNames.includes('works')) {
            const tableToFix = tableNames.includes('works') ? 'works' : 'mangas';
            console.log(`🛠️ Updating schema for \`${tableToFix}\`...`);

            const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableToFix}`);
            const columnNames = columns.map(c => c.Field);

            if (!columnNames.includes('original_title')) {
                await connection.query(`ALTER TABLE ${tableToFix} ADD COLUMN original_title VARCHAR(255) AFTER title`);
            }
            if (!columnNames.includes('rating_cache')) {
                await connection.query(`ALTER TABLE ${tableToFix} ADD COLUMN rating_cache DECIMAL(3,1) DEFAULT 0`);
            }
            if (!columnNames.includes('updated_at')) {
                await connection.query(`ALTER TABLE ${tableToFix} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
            }
        }

        // 4. Ensure `chapters` schema
        if (tableNames.includes('chapters')) {
            const [columns] = await connection.query('SHOW COLUMNS FROM chapters');
            const columnNames = columns.map(c => c.Field);
            if (columnNames.includes('manga_id') && !columnNames.includes('work_id')) {
                console.log('🔄 Renaming `chapters.manga_id` to `chapters.work_id`...');
                await connection.query('ALTER TABLE chapters CHANGE COLUMN manga_id work_id INT');
            }
            if (columnNames.includes('content')) {
                console.log('⚠️ `chapters.content` detected. This usually contains JSON images. We are moving to `chapter_images` table.');
                // We'll keep it for now but prioritize chapter_images
            }
        } else {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS chapters (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    work_id INT NOT NULL,
                    chapter_number INT NOT NULL,
                    title VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
                )
            `);
        }

        // 5. Ensure `chapter_images` schema
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chapter_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chapter_id INT NOT NULL,
                page_number INT NOT NULL,
                image_url VARCHAR(500) NOT NULL,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
            )
        `);

        // 6. Ensure `logs` table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(100) NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 7. Ensure `history` and `reading_progress` are consistent
        if (tableNames.includes('history')) {
            const [columns] = await connection.query('SHOW COLUMNS FROM history');
            const columnNames = columns.map(c => c.Field);
            if (columnNames.includes('manga_id') && !columnNames.includes('work_id')) {
                await connection.query('ALTER TABLE history CHANGE COLUMN manga_id work_id INT');
            }
        }

        if (tableNames.includes('reading_progress')) {
            const [columns] = await connection.query('SHOW COLUMNS FROM reading_progress');
            const columnNames = columns.map(c => c.Field);
            if (columnNames.includes('manga_id') && !columnNames.includes('work_id')) {
                await connection.query('ALTER TABLE reading_progress CHANGE COLUMN manga_id work_id INT');
            }
        }

        // 8. Ensure `work_tags` and `tags`
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tags (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                slug VARCHAR(50) NOT NULL UNIQUE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS work_tags (
                work_id INT NOT NULL,
                tag_id INT NOT NULL,
                PRIMARY KEY (work_id, tag_id),
                FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )
        `);

        // 9. Ensure `ratings`, `favorites`, `xp_logs`, `banners` are all present
        await connection.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                user_id INT NOT NULL,
                work_id INT NOT NULL,
                PRIMARY KEY (user_id, work_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Database consolidation complete!');
    } catch (error) {
        console.error('❌ Consolidation Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

consolidate();
