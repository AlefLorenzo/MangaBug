import pool from '../config/db.js';

export const runMigrations = async () => {
    try {
        console.log('🔄 Running database migrations...');

        // Create banners table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS banners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                manga_id INT NULL,
                image_url TEXT NOT NULL,
                title VARCHAR(255),
                subtitle VARCHAR(255),
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE SET NULL
            );
        `);

        // Create logs table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(50),
                target_type VARCHAR(50),
                target_id INT,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `);

        // Add updated_at to users table
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
        `).catch(e => {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ Column updated_at already exists in users.');
            } else {
                throw e;
            }
        });

        // Add content_type to chapters table
        await pool.query(`
            ALTER TABLE chapters 
            ADD COLUMN IF NOT EXISTS content_type ENUM('images', 'pdf') DEFAULT 'images';
        `).catch(e => {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ Column content_type already exists in chapters.');
            } else {
                throw e;
            }
        });

        console.log('✅ Core tables and columns verified.');
        console.log('✅ Migrations completed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    }
};

// If run directly
if (process.argv[1].includes('migrate.js')) {
    runMigrations().then(() => process.exit());
}
