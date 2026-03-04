import pool from '../config/db.js';

const checkUsers = async () => {
    try {
        const [rows] = await pool.query('SELECT id, username, email, is_admin FROM users');
        console.log('Database Users:');
        console.table(rows);
    } catch (error) {
        console.error('Error checking users:', error.message);
    } finally {
        process.exit();
    }
};

checkUsers();
