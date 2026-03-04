import pool from './src/config/db.js';

const seedData = async () => {
    try {
        console.log("🚀 Starting Full Database Seeding...");

        // 1. Create Tables in Correct Order
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            avatar_url VARCHAR(255) DEFAULT NULL,
            xp INT DEFAULT 0,
            level INT DEFAULT 1,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE = InnoDB`);

        await pool.query(`CREATE TABLE IF NOT EXISTS mangas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            cover_url VARCHAR(255),
            type ENUM('Mangá', 'Manhwa', 'Manhua') DEFAULT 'Mangá',
            status ENUM('Em andamento', 'Completo') DEFAULT 'Em andamento',
            author VARCHAR(100),
            artist VARCHAR(100),
            views INT DEFAULT 0,
            rating DECIMAL(2,1) DEFAULT 4.5,
            chapters_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE = InnoDB`);

        await pool.query(`CREATE TABLE IF NOT EXISTS chapters (
            id INT AUTO_INCREMENT PRIMARY KEY,
            manga_id INT NOT NULL,
            chapter_number INT NOT NULL,
            title VARCHAR(255),
            content JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
        ) ENGINE = InnoDB`);

        await pool.query(`CREATE TABLE IF NOT EXISTS favorites (
            user_id INT NOT NULL,
            manga_id INT NOT NULL,
            PRIMARY KEY (user_id, manga_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
        ) ENGINE = InnoDB`);

        await pool.query(`CREATE TABLE IF NOT EXISTS reading_progress (
            user_id INT NOT NULL,
            manga_id INT NOT NULL,
            chapter_id INT,
            page_number INT DEFAULT 1,
            progress_percentage INT DEFAULT 0,
            time_spent_seconds INT DEFAULT 0,
            last_read TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, manga_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
        ) ENGINE = InnoDB`);

        await pool.query(`CREATE TABLE IF NOT EXISTS tags (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE
        ) ENGINE = InnoDB`);

        await pool.query(`CREATE TABLE IF NOT EXISTS manga_tags (
            manga_id INT NOT NULL,
            tag_id INT NOT NULL,
            PRIMARY KEY (manga_id, tag_id),
            FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        ) ENGINE = InnoDB`);

        // 2. Insert User 1
        await pool.query(`
            INSERT IGNORE INTO users (id, username, email, password_hash, xp, level) 
            VALUES (1, 'MangaReader_42', 'reader@mangabug.com', 'scrypt_hash_here', 8520, 12)
        `);

        // 3. Insert 10 Mangas
        const mangas = [
            [1, 'Solo Leveling', 'Dez anos atrás, após o "Portal" que conectou o mundo real com o mundo de monstros se abriu.', 'https://cdn.myanimelist.net/images/manga/3/222295.jpg', 'Manhwa', 'Completo', 'Chugong', 'Redice Studio', 4.9, 179, 125000],
            [2, 'One Piece', 'Gol D. Roger era conhecido como o Rei dos Piratas.', 'https://cdn.myanimelist.net/images/manga/2/253146.jpg', 'Mangá', 'Em andamento', 'Eiichiro Oda', 'Eiichiro Oda', 4.9, 1112, 500000],
            [3, 'Berserk', 'Guts, um ex-mercenário agora conhecido como o Espadachim Negro.', 'https://cdn.myanimelist.net/images/manga/1/157897.jpg', 'Mangá', 'Em andamento', 'Kentaro Miura', 'Kentaro Miura', 5.0, 375, 89000],
            [4, 'Vagabond', 'Miyamoto Musashi, o espadachim mais famoso do Japão.', 'https://cdn.myanimelist.net/images/manga/1/259681.jpg', 'Mangá', 'Em andamento', 'Takehiko Inoue', 'Takehiko Inoue', 4.9, 327, 45000],
            [5, 'Kingdom', 'No Período dos Estados Combatentes da China.', 'https://cdn.myanimelist.net/images/manga/2/171872.jpg', 'Mangá', 'Em andamento', 'Yasuhisa Hara', 'Yasuhisa Hara', 4.8, 794, 32000],
            [6, 'Tower of God', 'O que você deseja? Dinheiro e riqueza? Glória e honra?', 'https://cdn.myanimelist.net/images/manga/2/155792.jpg', 'Manhwa', 'Em andamento', 'SIU', 'SIU', 4.7, 620, 150000],
            [7, 'The Beginning After The End', 'O Rei Grey tem força, riqueza e prestígio inigualáveis.', 'https://cdn.myanimelist.net/images/manga/3/235552.jpg', 'Manhwa', 'Em andamento', 'TurtleMe', 'Fuyuki23', 4.8, 175, 95000],
            [8, 'Omniscient Reader', 'Este é um mundo onde um romance se torna realidade.', 'https://cdn.myanimelist.net/images/manga/1/240166.jpg', 'Manhwa', 'Em andamento', 'Sing Shong', 'Sleepy-C', 4.9, 210, 110000],
            [9, 'Martial Peak', 'A jornada para o topo é solitária.', 'https://cdn.myanimelist.net/images/manga/3/260000.jpg', 'Manhua', 'Em andamento', 'Momo', 'Momo', 4.6, 6000, 200000],
            [10, 'Apotheosis', 'Luo Zheng era o antigo jovem mestre da família Luo.', 'https://cdn.myanimelist.net/images/manga/3/250000.jpg', 'Manhua', 'Em andamento', 'Ranzai Studio', 'Ranzai Studio', 4.7, 1100, 180000]
        ];

        for (const manga of mangas) {
            await pool.query(`
                INSERT IGNORE INTO mangas (id, title, description, cover_url, type, status, author, artist, rating, chapters_count, views)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, manga);
        }

        console.log("✅ Database Seeded Successfully with all tables!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding Failed:", err);
        process.exit(1);
    }
};

seedData();
