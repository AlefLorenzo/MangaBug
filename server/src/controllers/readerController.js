import pool from '../config/db.js';

export const getProgress = async (req, res) => {
    const { userId, workId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM reading_history WHERE user_id = ? AND work_id = ?',
            [userId, workId]
        );

        const [totalChapters] = await pool.query('SELECT COUNT(*) as count FROM chapters WHERE work_id = ?', [workId]);
        const [readChapters] = await pool.query('SELECT COUNT(*) as count FROM reading_history WHERE user_id = ? AND work_id = ? AND progress_percentage = 100', [userId, workId]);

        res.json({
            ...(rows[0] || { page_number: 1, chapter_id: null, progress_percentage: 0 }),
            total_chapters: totalChapters[0].count,
            read_chapters: readChapters[0].count
        });
    } catch (error) {
        console.error('getProgress Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const updateProgress = async (req, res) => {
    const { userId, workId, chapterId, pageNumber, progressPercentage } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            `INSERT INTO reading_history (user_id, work_id, chapter_id, page_number, progress_percentage)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                chapter_id = VALUES(chapter_id),
                page_number = VALUES(page_number),
                progress_percentage = GREATEST(progress_percentage, VALUES(progress_percentage)),
                last_read = CURRENT_TIMESTAMP`,
            [userId, workId, chapterId, pageNumber || 1, progressPercentage || 0]
        );

        // XP Award logic
        const [existingLog] = await connection.query(
            'SELECT id FROM xp_logs WHERE user_id = ? AND reason LIKE ?',
            [userId, `%Read chapter ${chapterId}%`]
        );

        if (existingLog.length === 0) {
            const xpAmount = 50;
            await connection.query('UPDATE users SET xp = xp + ?, level = FLOOR((xp + ?) / 1000) WHERE id = ?', [xpAmount, xpAmount, userId]);
            await connection.query('INSERT INTO xp_logs (user_id, amount, reason) VALUES (?, ?, ?)', [userId, xpAmount, `Read chapter ${chapterId}`]);
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('history_updated', { userId, workId, chapterId });

        res.json({ success: true, message: 'Progress saved' });
    } catch (error) {
        await connection.rollback();
        console.error('updateProgress Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        connection.release();
    }
};

export const completeChapter = async (req, res) => {
    const { userId, chapterId } = req.body;
    try {
        // Award 100 XP for completion if not already awarded deeply
        // We can use the existing addXp utility from gamificationController
        // Since we are in readerController, we'll try to use a direct pool query or import
        try {
            const [user] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
            if (user.length > 0) {
                // Award XP logic (Simplified version of addXp but inline to avoid circular deps if they exist)
                const xpToAdd = 100;
                await pool.query('UPDATE users SET xp = xp + ?, level = FLOOR((xp + ?) / 1000) WHERE id = ?', [xpToAdd, xpToAdd, userId]);
                await pool.query('INSERT INTO xp_logs (user_id, amount, reason) VALUES (?, ?, ?)', [userId, xpToAdd, 'Concluí um capítulo']);

                const io = global.io;
                if (io) io.emit('user_updated', { userId });
            }
        } catch (e) {
            console.error('XP Award Error:', e);
        }

        await pool.query(
            'UPDATE reading_history SET progress_percentage = 100, last_read = CURRENT_TIMESTAMP WHERE user_id = ? AND chapter_id = ?',
            [userId, chapterId]
        );

        const io = global.io;
        if (io) io.emit('history_updated', { userId, chapterId, action: 'complete' });

        res.json({ success: true, message: 'Chapter marked as completed' });
    } catch (error) {
        console.error('completeChapter Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
