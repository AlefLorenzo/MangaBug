import pool from '../config/db.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { addXp } from './gamificationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT id, username, avatar_url, xp, level, title, last_active_at, created_at, is_public FROM users WHERE id = $1',
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const userData = rows[0];
        if (userData.is_public === 0) {
            return res.status(403).json({ error: 'Este perfil é privado.' });
        }

        const [history] = await pool.query('SELECT COUNT(*) as count FROM reading_history WHERE user_id = $1', [id]);
        const [favorites] = await pool.query('SELECT COUNT(*) as count FROM favorites WHERE user_id = $1', [id]);

        const [rankRes] = await pool.query(
            'SELECT COUNT(*) + 1 as rank FROM users WHERE (level * 100000 + xp) > (SELECT (level * 100000 + xp) FROM users WHERE id = $1)',
            [id]
        );

        const [recentHistory] = await pool.query(`
            SELECT 
                w.id as work_id, w.title, w.cover_url, 
                rh.progress_percentage as progress, rh.last_read
            FROM reading_history rh
            JOIN works w ON rh.work_id = w.id
            WHERE rh.user_id = $1
            ORDER BY rh.last_read DESC
            LIMIT 5
        `, [id]);

        res.json({
            ...userData,
            rank: parseInt(rankRes[0].rank) || 1,
            stats: {
                total_chapters: parseInt(history[0].count) || 0,
                total_favorites: parseInt(favorites[0].count) || 0
            },
            recent_reads: recentHistory
        });
    } catch (error) {
        console.error('getProfile Error:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
};

export const updateAvatar = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    const id = req.user.id;
    const filename = `avatar-${id}-${Date.now()}.webp`;
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    const outputPath = path.join(uploadDir, filename);

    try {
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        await sharp(req.file.buffer)
            .resize(300, 300)
            .webp({ quality: 85 })
            .toFile(outputPath);

        const avatarUrl = `/uploads/avatars/${filename}`;
        await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, id]);
        res.json({ success: true, message: 'Avatar atualizado!', avatar_url: avatarUrl });
    } catch (error) {
        console.error('updateAvatar Error:', error);
        res.status(500).json({ error: 'Erro ao atualizar avatar' });
    }
};

export const updateBasicInfo = async (req, res) => {
    const { username, email, is_public } = req.body;
    const id = req.user.id;
    try {
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
            [username, email, id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Username ou Email já em uso' });
        }

        await pool.query(
            'UPDATE users SET username = $1, email = $2, is_public = $3 WHERE id = $4',
            [username, email, is_public === undefined ? 1 : is_public, id]
        );

        const [rows] = await pool.query(
            'SELECT id, username, email, avatar_url, xp, level, title, is_public, created_at FROM users WHERE id = $1',
            [id]
        );

        res.json({ success: true, message: 'Perfil atualizado com sucesso', user: rows[0] });
    } catch (error) {
        console.error('updateBasicInfo Error:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar perfil' });
    }
};

export const getFavorites = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT w.* FROM works w JOIN favorites f ON w.id = f.work_id WHERE f.user_id = $1',
            [id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getFavorites Error:', error);
        res.status(500).json({ error: 'Erro ao buscar favoritos' });
    }
};

export const getHistory = async (req, res) => {
    const { id: userId } = req.params;
    const { uniqueWorks } = req.query;
    try {
        let query = `
            SELECT 
                w.id as work_id, w.title, w.cover_url, 
                rh.chapter_id, c.chapter_number, rh.page_number, 
                rh.progress_percentage as progress, rh.last_read
            FROM reading_history rh
            JOIN works w ON rh.work_id = w.id
            LEFT JOIN chapters c ON rh.chapter_id = c.id
            WHERE rh.user_id = $1
        `;

        let params = [userId];

        if (uniqueWorks === 'true') {
            query += ` AND rh.id IN (
                SELECT MAX(id) FROM reading_history WHERE user_id = $2 GROUP BY work_id
            )`;
            params.push(userId);
        }

        query += ` ORDER BY rh.last_read DESC`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('getHistory Error:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
};

export const toggleFavorite = async (req, res) => {
    const { workId } = req.body;
    const userId = req.user.id;
    try {
        const [exists] = await pool.query('SELECT * FROM favorites WHERE user_id = $1 AND work_id = $2', [userId, workId]);
        if (exists.length > 0) {
            await pool.query('DELETE FROM favorites WHERE user_id = $1 AND work_id = $2', [userId, workId]);
            res.json({ success: true, message: 'Removido dos favoritos', action: 'removed' });
        } else {
            await pool.query('INSERT INTO favorites (user_id, work_id) VALUES ($1, $2)', [userId, workId]);
            res.json({ success: true, message: 'Adicionado aos favoritos', action: 'added' });
        }
    } catch (error) {
        console.error('toggleFavorite Error:', error);
        res.status(500).json({ error: 'Erro ao gerenciar favorito' });
    }
};

export const getCurrentUser = async (req, res) => {
    const id = req.user.id;
    try {
        await pool.query('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

        const [rows] = await pool.query(
            'SELECT id, username, email, avatar_url, xp, level, title, is_public, is_admin, created_at FROM users WHERE id = $1',
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const [history] = await pool.query('SELECT COUNT(*) as count FROM reading_history WHERE user_id = $1', [id]);
        const [favorites] = await pool.query('SELECT COUNT(*) as count FROM favorites WHERE user_id = $1', [id]);

        res.json({
            ...rows[0],
            stats: {
                total_chapters: parseInt(history[0].count) || 0,
                total_favorites: parseInt(favorites[0].count) || 0
            }
        });
    } catch (error) {
        console.error('getCurrentUser Error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
};

export const updatePreference = async (req, res) => {
    const { clean_mode } = req.body;
    const userId = req.user.id;
    try {
        await pool.query('UPDATE users SET clean_mode = $1 WHERE id = $2', [clean_mode ? 1 : 0, userId]);
        res.json({ success: true, message: 'Preferências atualizadas!' });
    } catch (error) {
        console.error('updatePreference Error:', error);
        res.status(500).json({ error: 'Erro ao atualizar preferências' });
    }
};

export const clearHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query('DELETE FROM reading_history WHERE user_id = $1', [userId]);
        res.json({ success: true, message: 'Seu histórico foi limpo permanentemente' });
    } catch (error) {
        console.error('clearHistory Error:', error);
        res.status(500).json({ success: false, error: 'Erro ao limpar histórico' });
    }
};

export const addHistory = async (req, res) => {
    const { chapterId, page_number, progress_percentage } = req.body;
    const userId = req.user.id;
    try {
        const [chapters] = await pool.query('SELECT work_id FROM chapters WHERE id = $1', [chapterId]);
        if (chapters.length === 0) return res.status(404).json({ error: 'Chapter not found' });

        const workId = chapters[0].work_id;

        await pool.query(
            `INSERT INTO reading_history (user_id, work_id, chapter_id, page_number, progress_percentage)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, work_id) DO UPDATE SET 
                chapter_id = EXCLUDED.chapter_id,
                page_number = EXCLUDED.page_number,
                progress_percentage = EXCLUDED.progress_percentage,
                last_read = CURRENT_TIMESTAMP`,
            [userId, workId, chapterId, page_number || 1, progress_percentage || 0]
        );

        try {
            const [user] = await pool.query('SELECT level FROM users WHERE id = $1', [userId]);
            const currentLevel = user[0]?.level || 1;
            const xpAmount = currentLevel <= 10 ? 10 : 20;
            await addXp(userId, xpAmount, 'Li um capítulo');
        } catch (e) { console.error('XP Error:', e); }

        const io = global.io;
        if (io) io.emit('history_updated', { userId, workId, chapterId });

        res.json({ success: true, message: 'History added' });
    } catch (error) {
        console.error('addHistory Error:', error);
        res.status(500).json({ error: 'Erro ao adicionar ao histórico' });
    }
};

export const deleteHistory = async (req, res) => {
    const { id: workId } = req.params;
    const userId = req.user.id;
    try {
        await pool.query('DELETE FROM reading_history WHERE work_id = $1 AND user_id = $2', [workId, userId]);
        res.json({ success: true, message: 'Entry removed from history' });
    } catch (error) {
        console.error('deleteHistory Error:', error);
        res.status(500).json({ error: 'Erro ao remover do histórico' });
    }
};

export const updateProgress = async (req, res) => {
    const { workId, chapterId, pageNumber, progress } = req.body;
    const userId = req.user.id;
    try {
        await pool.query(
            `INSERT INTO reading_history (user_id, work_id, chapter_id, page_number, progress_percentage)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, work_id) DO UPDATE SET 
                chapter_id = EXCLUDED.chapter_id,
                page_number = EXCLUDED.page_number,
                progress_percentage = GREATEST(reading_history.progress_percentage, EXCLUDED.progress_percentage),
                last_read = CURRENT_TIMESTAMP`,
            [userId, workId, chapterId, pageNumber || 1, progress || 0]
        );
        res.json({ success: true, message: 'Progress updated' });
    } catch (error) {
        console.error('updateProgress Error:', error);
        res.status(500).json({ error: 'Erro ao atualizar progresso' });
    }
};
