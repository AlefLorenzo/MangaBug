import pool from '../config/db.js';

export const getXpRequired = (level) => {
    if (level < 1) return 100;
    if (level >= 50) return Infinity;
    if (level <= 10) return 100 * level;
    if (level <= 19) return 200 * level;
    return 300 * level;
};

export const getUserTitle = (level) => {
    if (level <= 10) return 'Iniciante';
    if (level <= 30) return 'Leitor Ascendente';
    return 'Mestre das Obras';
};

export const getLeaderboard = async (req, res) => {
    try {
        const [allUsers] = await pool.query(
            'SELECT id, username, avatar_url, xp, level FROM users ORDER BY (level * 100000 + xp) DESC'
        );
        const results = allUsers.map(u => ({
            ...u,
            title: getUserTitle(u.level)
        }));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const getUserRank = async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT COUNT(*) + 1 as rank FROM users WHERE (level * 100000 + xp) > (SELECT (level * 100000 + xp) FROM users WHERE id = $1)',
            [userId]
        );
        const [userData] = await pool.query('SELECT xp, level FROM users WHERE id = $1', [userId]);

        const level = userData[0]?.level || 1;
        res.json({
            rank: parseInt(rows[0].rank) || 1,
            xp: userData[0]?.xp || 0,
            level: level,
            nextLevelXp: getXpRequired(level),
            title: getUserTitle(level)
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const getAchievements = async (req, res) => {
    const { userId } = req.params;
    try {
        const [all] = await pool.query('SELECT * FROM achievements');
        const [unlocked] = await pool.query(
            'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
            [userId]
        );

        const unlockedIds = unlocked.map(u => u.achievement_id);
        const results = all.map(ach => ({
            ...ach,
            unlocked: unlockedIds.includes(ach.id)
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const addXp = async (userId, amount, reason) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [user] = await connection.query('SELECT xp, level FROM users WHERE id = $1', [userId]);
        if (user.length === 0) throw new Error('User not found');

        let { xp, level } = user[0];
        if (level < 1) level = 1;

        xp += amount;
        let levelsGained = 0;

        while (level < 50) {
            const req = getXpRequired(level);
            if (xp >= req) {
                xp -= req;
                level++;
                levelsGained++;
            } else {
                break;
            }
        }

        if (level >= 50) level = 50;

        await connection.query(
            'UPDATE users SET xp = $1, level = $2 WHERE id = $3',
            [xp, level, userId]
        );

        await connection.query(
            'INSERT INTO xp_logs (user_id, amount, reason) VALUES ($1, $2, $3)',
            [userId, amount, reason]
        );

        await connection.commit();

        const io = global.io;
        if (io) io.emit('user_updated', {
            userId,
            levelUp: levelsGained > 0,
            newLevel: level,
            newTitle: getUserTitle(level)
        });

        return { success: true, levelUp: levelsGained > 0, newLevel: level };
    } catch (error) {
        await connection.rollback();
        console.error('addXp Error:', error);
        throw error;
    } finally {
        connection.release();
    }
};
