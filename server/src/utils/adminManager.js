import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeAdmin = async () => {
    // Save to the project root directory
    const filePath = path.join(__dirname, '../../../admin_credentials.txt');

    try {
        // 1. Check if ANY admin exists in DB
        const [rows] = await pool.query('SELECT username, email FROM users WHERE is_admin = 1 LIMIT 1');
        const fileExists = fs.existsSync(filePath);

        if (rows.length > 0) {
            if (!fileExists) {
                console.log('ℹ️ AUTH: Admin exists in database but credentials file is missing.');
                // We don't recreate to avoid changing passwords/usernames unexpectedly
                console.log('ℹ️ AUTH: Use existing credentials or reset manually if forgotten.');
            } else {
                console.log('✅ AUTH: Admin system ready (DB + Credentials file).');
            }
            return;
        }

        // 2. Only if NO admin exists, create one
        console.log('🛠️ AUTH: No admin found. Generating initial credentials...');

        const username = 'admin';
        const password = 'admin123';
        const email = 'admin@mangabug.com';
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, true]
        );

        const content = `ADMIN LOGIN\nUsername: ${username}\nEmail: ${email}\nPassword: ${password}\n\nGenerated at: ${new Date().toLocaleString()}\nKeep this file safe and delete after noting credentials.`;
        fs.writeFileSync(filePath, content);

        console.log(`🚀 AUTH: Admin created automatically. Credentials saved to ${filePath}`);
    } catch (error) {
        console.error('❌ AUTH: Failed to initialize admin:', error.message);
    }
};
