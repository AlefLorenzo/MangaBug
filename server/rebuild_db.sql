-- 📦 Database Reconstruction for MangaBug - PROFESSIONAL SCHEMA
DROP DATABASE IF EXISTS mangabug_final;
CREATE DATABASE mangabug_final;
USE mangabug_final;
-- 👤 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    avatar_url VARCHAR(255),
    reading_mode VARCHAR(20) DEFAULT 'page',
    -- 'page' or 'webtoon'
    clean_mode TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;
-- 🏮 2. Mangas Table
CREATE TABLE IF NOT EXISTS mangas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100),
    artist VARCHAR(100),
    description TEXT,
    cover_url VARCHAR(255),
    type VARCHAR(50) DEFAULT 'Mangá',
    -- Mangá, Manhwa, Manhua
    status VARCHAR(50) DEFAULT 'Em andamento',
    -- Em andamento, Completo, Hiato
    views INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    -- Actual average calculated from ratings table
    genres VARCHAR(255),
    -- Denormalized for fast listing display
    chapters_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (views),
    INDEX (created_at),
    FULLTEXT INDEX (title, author, description)
) ENGINE = InnoDB;
-- 📂 3. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manga_id INT NOT NULL,
    chapter_number DECIMAL(10, 1) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    -- JSON array of image URLs
    content_type ENUM('images', 'pdf') DEFAULT 'images',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    INDEX (manga_id, chapter_number)
) ENGINE = InnoDB;
-- ⭐ 4. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    user_id INT NOT NULL,
    manga_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- 📊 5. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    manga_id INT NOT NULL,
    value TINYINT NOT NULL CHECK (
        value BETWEEN 1 AND 5
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_manga_rating (user_id, manga_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- 📖 6. Reading Progress Table
CREATE TABLE IF NOT EXISTS reading_progress (
    user_id INT NOT NULL,
    manga_id INT NOT NULL,
    chapter_id INT,
    page_number INT DEFAULT 1,
    progress_percentage INT DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    last_read TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE
    SET NULL
) ENGINE = InnoDB;
-- 📜 7. History Table
CREATE TABLE IF NOT EXISTS history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    manga_id INT NOT NULL,
    chapter_id INT NOT NULL,
    is_completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_chapter (user_id, chapter_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- 🏷️ 8. Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE = InnoDB;
-- 🎭 9. Genres Table (Standard Categories)
CREATE TABLE IF NOT EXISTS genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE = InnoDB;
-- 🔗 10. Manga Tags & Genres Relations
CREATE TABLE IF NOT EXISTS manga_tags (
    manga_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (manga_id, tag_id),
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE = InnoDB;
CREATE TABLE IF NOT EXISTS manga_genres (
    manga_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (manga_id, genre_id),
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- 📝 11. Activity Logs
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    -- 'create_manga', 'add_chapter', 'read_chapter'
    target_type VARCHAR(50),
    -- 'manga', 'chapter'
    target_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;
-- 🎡 12. Banners Table (NEW)
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manga_id INT,
    image_url VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE
    SET NULL
) ENGINE = InnoDB;
-- 🏁 SEED DATA
-- 20 Standard Genres
INSERT INTO genres (name)
VALUES ('Ação'),
    ('Aventura'),
    ('Comédia'),
    ('Drama'),
    ('Fantasia'),
    ('Horror'),
    ('Mistério'),
    ('Psicológico'),
    ('Romance'),
    ('Sci-Fi'),
    ('Seinen'),
    ('Shoujo'),
    ('Shounen'),
    ('Slice of Life'),
    ('Sobrenatural'),
    ('Suspense'),
    ('Artes Marciais'),
    ('Isekai'),
    ('Escolar'),
    ('Histórico');
-- Note: All sample mangas and chapters have been removed as per user request to favor manual admin entries.
-- Select confirmation
SELECT 'Professional Database Reconstruction with Banners Complete!' as status;