import pool from './config/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function resetAdmin() {
    const connection = await pool.getConnection();
    try {
        const newPassword = 'admin123';
        const hash = await bcrypt.hash(newPassword, 10);

        // Update existing admin's password
        const [result] = await connection.query(
            'UPDATE users SET password_hash = ? WHERE is_admin = 1',
            [hash]
        );

        // Get admin info
        const [admins] = await connection.query('SELECT id, username, email FROM users WHERE is_admin = 1');

        if (admins.length > 0) {
            const admin = admins[0];
            console.log('✅ Admin password reset successfully!');
            console.log(`   Username: ${admin.username}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   New Password: ${newPassword}`);
        } else {
            console.log('⚠️ No admin found, creating one...');
            const hash2 = await bcrypt.hash(newPassword, 10);
            await connection.query(
                'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, 1)',
                ['admin', 'admin@mangabug.com', hash2]
            );
            console.log('✅ Admin created!');
            console.log('   Email: admin@mangabug.com');
            console.log(`   Password: ${newPassword}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

resetAdmin();
