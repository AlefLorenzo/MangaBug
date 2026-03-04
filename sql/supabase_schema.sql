-- ============================================================
-- MangaBug — Schema PostgreSQL para Supabase
-- Compatível com o código existente (server/src/controllers/*)
-- ============================================================
-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    title VARCHAR(100) DEFAULT 'Iniciante',
    clean_mode SMALLINT DEFAULT 0,
    is_admin SMALLINT DEFAULT 0,
    is_public SMALLINT DEFAULT 1,
    last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- 2. WORKS
CREATE TABLE IF NOT EXISTS works (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    description TEXT,
    author VARCHAR(255),
    artist VARCHAR(255),
    cover_url VARCHAR(500),
    type VARCHAR(20) DEFAULT 'manga' CHECK (
        type IN ('manga', 'manhwa', 'manhua', 'novel', 'comic')
    ),
    status VARCHAR(20) DEFAULT 'ongoing' CHECK (
        status IN ('ongoing', 'completed', 'hiatus', 'cancelled')
    ),
    tags JSONB,
    rating_cache NUMERIC(3, 1) DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_works_type ON works(type);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
CREATE INDEX IF NOT EXISTS idx_works_views ON works(views);
-- 3. TAGS + WORK_TAGS
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS work_tags (
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (work_id, tag_id)
);
-- 4. CHAPTERS
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    chapter_number NUMERIC(10, 2) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chapters_work ON chapters(work_id, chapter_number);
-- 5. CHAPTER IMAGES
CREATE TABLE IF NOT EXISTS chapter_images (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    page_number INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chapter_images_chapter ON chapter_images(chapter_id, page_number);
-- 6. FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, work_id)
);
-- 7. READING HISTORY
CREATE TABLE IF NOT EXISTS reading_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE
    SET NULL,
        page_number INTEGER DEFAULT 1,
        progress_percentage INTEGER DEFAULT 0,
        last_read TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, work_id)
);
-- 8. RATINGS
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    rating NUMERIC(3, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, work_id)
);
-- 9. XP LOGS
CREATE TABLE IF NOT EXISTS xp_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id);
-- 10. BANNERS
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    work_id INTEGER REFERENCES works(id) ON DELETE
    SET NULL,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        description TEXT,
        is_active SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- 11. BANNER BUTTONS
CREATE TABLE IF NOT EXISTS banner_buttons (
    id SERIAL PRIMARY KEY,
    banner_id INTEGER NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
    label VARCHAR(100),
    action_type VARCHAR(50),
    action_value VARCHAR(255),
    display_order INTEGER DEFAULT 0
);
-- 12. LOGS
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
-- 13. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    icon VARCHAR(50) DEFAULT '🏆',
    xp_reward INTEGER DEFAULT 100,
    requirement_type VARCHAR(30) NOT NULL CHECK (
        requirement_type IN (
            'chapters_read',
            'level_reached',
            'days_active',
            'works_completed'
        )
    ),
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- 14. USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);
-- ─────────────────────────────────────────────────────────────
-- SEEDS — tags básicas
-- ─────────────────────────────────────────────────────────────
INSERT INTO tags (name, slug)
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
    ('Sci-Fi', 'sci-fi') ON CONFLICT (name) DO NOTHING;
-- SEEDS — conquistas
INSERT INTO achievements (
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
    ) ON CONFLICT (name) DO NOTHING;
-- ADMIN PADRÃO — senha: admin123
INSERT INTO users (
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
    ) ON CONFLICT (email) DO NOTHING;