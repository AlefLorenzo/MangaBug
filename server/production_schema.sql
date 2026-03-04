-- 🏗️ TOP-TIER MANGA PLATFORM - PRODUCTION SCHEMA (MySQL)
CREATE DATABASE IF NOT EXISTS manga_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE manga_library;
-- 👤 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    xp INT DEFAULT 0,
    level INT DEFAULT 0,
    reading_mode ENUM('page', 'webtoon') DEFAULT 'page',
    clean_mode TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (username),
    INDEX (email)
) ENGINE = InnoDB;
-- 🛡️ 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (username)
) ENGINE = InnoDB;
-- 📚 3. Works Table (Manga, Manhwa, Manhua)
CREATE TABLE IF NOT EXISTS works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100),
    artist VARCHAR(100),
    description TEXT,
    cover_url VARCHAR(255),
    type ENUM('Mangá', 'Manhwa', 'Manhua') DEFAULT 'Mangá',
    status ENUM('Em andamento', 'Completo', 'Hiato') DEFAULT 'Em andamento',
    views INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    chapters_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (title),
    INDEX (views),
    FULLTEXT INDEX (title, author, description)
) ENGINE = InnoDB;
-- 📂 4. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT NOT NULL,
    chapter_number DECIMAL(10, 1) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    INDEX (work_id, chapter_number)
) ENGINE = InnoDB;
-- 🖼️ 5. Chapter Images Table
CREATE TABLE IF NOT EXISTS chapter_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    INDEX (chapter_id, order_index)
) ENGINE = InnoDB;
-- 🏷️ 6. Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    INDEX (name)
) ENGINE = InnoDB;
-- 🔗 7. Work Tags Table
CREATE TABLE IF NOT EXISTS work_tags (
    work_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (work_id, tag_id),
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- ⭐ 8. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    user_id INT NOT NULL,
    work_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, work_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- 📊 9. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_id INT NOT NULL,
    value TINYINT NOT NULL CHECK (
        value BETWEEN 1 AND 5
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id, work_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- 📜 10. Reading History Table
CREATE TABLE IF NOT EXISTS reading_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_id INT NOT NULL,
    chapter_id INT NOT NULL,
    page_number INT DEFAULT 1,
    progress_percentage INT DEFAULT 0,
    last_read TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id, work_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- 📈 11. XP Logs Table
CREATE TABLE IF NOT EXISTS xp_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id)
) ENGINE = InnoDB;
-- 🎡 12. Banners Table
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    image_url VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE
    SET NULL
) ENGINE = InnoDB;
-- 🏆 13. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    icon_url VARCHAR(255),
    xp_reward INT DEFAULT 100,
    requirement_type ENUM(
        'chapters_read',
        'level_reached',
        'mangas_completed'
    ) NOT NULL,
    requirement_value INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;
-- 🎖️ 14. User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE = InnoDB;
-- 🏁 SEED DATA (CORE TAGS)
INSERT IGNORE INTO tags (name)
VALUES ('Ação'),
    ('Aventura'),
    ('Romance'),
    ('Drama'),
    ('Comédia'),
    ('Terror'),
    ('Suspense'),
    ('Mistério'),
    ('Sobrenatural'),
    ('Escolar'),
    ('Isekai'),
    ('Artes Marciais'),
    ('Slice of Life'),
    ('Seinen'),
    ('Shounen'),
    ('Shoujo'),
    ('Fantasia'),
    ('Psicológico'),
    ('Histórico'),
    ('Sci-Fi');
-- 🏁 SEED DATA (CORE ACHIEVEMENTS)
INSERT IGNORE INTO achievements (
        name,
        description,
        requirement_type,
        requirement_value,
        xp_reward
    )
VALUES (
        'Iniciante',
        'Leia seu primeiro capítulo.',
        'chapters_read',
        1,
        50
    ),
    (
        'Leitor Assíduo',
        'Leia 10 capítulos.',
        'chapters_read',
        10,
        200
    ),
    (
        'Bibliotecário',
        'Leia 50 capítulos.',
        'chapters_read',
        50,
        500
    ),
    (
        'Mestre do Manga',
        'Leia 100 capítulos.',
        'chapters_read',
        100,
        1000
    ),
    (
        'Subindo de Nível',
        'Chegue ao nível 5.',
        'level_reached',
        5,
        250
    ),
    (
        'Veterano',
        'Chegue ao nível 20.',
        'level_reached',
        20,
        1000
    );