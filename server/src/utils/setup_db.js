import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db.sqlite');

// Remove corrupted DB if exists
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    is_admin INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mangas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    author TEXT,
    artist TEXT,
    cover_url TEXT,
    type TEXT,
    status TEXT,
    tags TEXT,
    views INTEGER DEFAULT 0,
    rating REAL DEFAULT 4.5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER,
    chapter_number TEXT,
    title TEXT,
    content TEXT,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(manga_id) REFERENCES mangas(id)
);

CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    manga_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(manga_id) REFERENCES mangas(id)
);

CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    chapter_id INTEGER,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(chapter_id) REFERENCES chapters(id)
);

CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT,
    link_url TEXT,
    title TEXT,
    active INTEGER DEFAULT 1
);
`;

db.serialize(() => {
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error creating database:', err.message);
        } else {
            console.log('Database schema created successfully.');
            // Add initial admin
            // Password 'admin123' hashed (approx)
            // Note: Use actual bcrypt in production, this is for testing
            db.run('INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@bug.com', '$2a$10$7R.E.0Yp5/886D1Hn9lOieL8Hq3l7..E.iY.8k.7.8.H.q.u.u.u', 1]);
        }
        db.close();
    });
});
