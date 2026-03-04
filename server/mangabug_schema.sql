-- ============================================================
-- MangaBug — Schema Definitivo para XAMPP/MySQL
-- Database: mangabug
-- Compatível com o código existente (server/src/controllers/*)
-- SEGURO: Usa IF NOT EXISTS em tudo, não apaga dados
-- ============================================================
CREATE DATABASE IF NOT EXISTS mangabug CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mangabug;
-- ─────────────────────────────────────────────────────────────
-- 1. USERS (tabela unificada — is_admin distingue admins)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    clean_mode TINYINT(1) DEFAULT 0,
    is_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ─────────────────────────────────────────────────────────────
-- 2. WORKS (manga / manhwa / manhua)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS works (
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
    rating_cache DECIMAL(3, 1) DEFAULT 0,
    views INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_views (views)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ─────────────────────────────────────────────────────────────
-- 3. TAGS + WORK_TAGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS work_tags (
    work_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (work_id, tag_id),
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- ─────────────────────────────────────────────────────────────
-- 4. CHAPTERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT NOT NULL,
    chapter_number DECIMAL(10, 2) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    INDEX idx_work_chapter (work_id, chapter_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ─────────────────────────────────────────────────────────────
-- 5. CHAPTER IMAGES (páginas do capítulo)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapter_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    image_url TEXT NOT NULL,
    page_number INT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    INDEX idx_chapter_page (chapter_id, page_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ─────────────────────────────────────────────────────────────
-- 6. FAVORITES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
    user_id INT NOT NULL,
    work_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, work_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- ─────────────────────────────────────────────────────────────
-- 7. READING HISTORY
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_id INT NOT NULL,
    chapter_id INT,
    page_number INT DEFAULT 1,
    progress_percentage INT DEFAULT 0,
    last_read TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_work (user_id, work_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE
    SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ─────────────────────────────────────────────────────────────
-- 8. RATINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_id INT NOT NULL,
    rating DECIMAL(3, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_work (user_id, work_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- ─────────────────────────────────────────────────────────────
-- 9. XP LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ─────────────────────────────────────────────────────────────
-- 10. BANNERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_id INT,
    image_url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE
    SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ─────────────────────────────────────────────────────────────
-- 11. LOGS (atividades admin)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ─────────────────────────────────────────────────────────────
-- 12. ACHIEVEMENTS + USER_ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    icon VARCHAR(50) DEFAULT '🏆',
    xp_reward INT DEFAULT 100,
    requirement_type ENUM(
        'chapters_read',
        'level_reached',
        'days_active',
        'works_completed'
    ) NOT NULL,
    requirement_value INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- ─────────────────────────────────────────────────────────────
-- SEEDS — tags básicas
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO tags (name, slug)
VALUES ('Ação', 'acao'),
    ('Aventura', 'aventura'),
    ('Romance', 'romance'),
    ('Drama', 'drama'),
    ('Comédia', 'comedia'),
    ('Terror', 'terror'),
    ('Suspense', 'suspense'),
    ('Mistério', 'misterio'),
    ('Sobrenatural', 'sobrenatural'),
    ('Escolar', 'escolar'),
    ('Isekai', 'isekai'),
    ('Artes Marciais', 'artes-marciais'),
    ('Slice of Life', 'slice-of-life'),
    ('Seinen', 'seinen'),
    ('Shounen', 'shounen'),
    ('Shoujo', 'shoujo'),
    ('Fantasia', 'fantasia'),
    ('Psicológico', 'psicologico'),
    ('Histórico', 'historico'),
    ('Sci-Fi', 'sci-fi');
-- ─────────────────────────────────────────────────────────────
-- SEEDS — conquistas
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO achievements (
        name,
        description,
        icon,
        requirement_type,
        requirement_value,
        xp_reward
    )
VALUES (
        'Iniciante',
        'Leia seu primeiro capítulo.',
        '📖',
        'chapters_read',
        1,
        50
    ),
    (
        'Leitor Assíduo',
        'Leia 10 capítulos.',
        '📚',
        'chapters_read',
        10,
        200
    ),
    (
        'Bibliotecário',
        'Leia 50 capítulos.',
        '🏛️',
        'chapters_read',
        50,
        500
    ),
    (
        'Mestre do Manga',
        'Leia 100 capítulos.',
        '👑',
        'chapters_read',
        100,
        1000
    ),
    (
        'Subindo de Nível',
        'Chegue ao nível 5.',
        '⚡',
        'level_reached',
        5,
        250
    ),
    (
        'Veterano',
        'Chegue ao nível 20.',
        '🔥',
        'level_reached',
        20,
        1000
    );
-- ─────────────────────────────────────────────────────────────
-- ADMIN PADRÃO — senha: admin123
--   bcrypt hash de 'admin123' com cost=10
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO users (
        username,
        email,
        password_hash,
        is_admin,
        xp,
        level
    )
VALUES (
        'admin',
        'admin@mangabug.com',
        '$2b$10$JVrmBPzp96yVa/ehdrB1BOPmf5PfC17IUq5pO858iETmqxuRlexim',
        1,
        0,
        1
    );