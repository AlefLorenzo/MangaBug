import pool from '../config/db.js';

export const getBanners = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, w.title as work_title 
            FROM banners b 
            LEFT JOIN works w ON b.work_id = w.id 
            WHERE b.is_active = 1 
            ORDER BY b.id DESC
        `);

        // Fetch buttons for each banner
        for (let banner of rows) {
            const [buttons] = await pool.query('SELECT * FROM banner_buttons WHERE banner_id = $1 ORDER BY display_order ASC', [banner.id]);
            banner.buttons = buttons;
        }

        res.json(rows);
    } catch (error) {
        console.error('getBanners Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const createBanner = async (req, res) => {
    const { work_id, title, subtitle, buttons } = req.body;
    const image_url = req.file ? `/uploads/banners/${req.file.filename}` : req.body.image_url;
    const finalWorkId = work_id === '' || work_id === 'undefined' ? null : work_id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO banners (work_id, image_url, title, subtitle) VALUES ($1, $2, $3, $4) RETURNING id',
            [finalWorkId, image_url, title, subtitle]
        );
        const bannerId = result[0].id;

        if (buttons && Array.isArray(buttons)) {
            for (let btn of buttons) {
                await connection.query(
                    'INSERT INTO banner_buttons (banner_id, label, action_type, action_value, display_order) VALUES ($1, $2, $3, $4, $5)',
                    [bannerId, btn.label, btn.action_type, btn.action_value, btn.display_order || 0]
                );
            }
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('banners_updated', { action: 'create', id: bannerId });

        res.json({ success: true, id: bannerId });
    } catch (error) {
        await connection.rollback();
        console.error('createBanner Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        connection.release();
    }
};

export const updateBanner = async (req, res) => {
    const { id } = req.params;
    const { work_id, title, subtitle, active: is_active, buttons } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'UPDATE banners SET work_id = $1, title = $2, subtitle = $3, is_active = $4 WHERE id = $5',
            [work_id || null, title, subtitle, is_active ? 1 : 0, id]
        );

        if (buttons && Array.isArray(buttons)) {
            await connection.query('DELETE FROM banner_buttons WHERE banner_id = $1', [id]);
            for (let btn of buttons) {
                await connection.query(
                    'INSERT INTO banner_buttons (banner_id, label, action_type, action_value, display_order) VALUES ($1, $2, $3, $4, $5)',
                    [id, btn.label, btn.action_type, btn.action_value, btn.display_order || 0]
                );
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error('updateBanner Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        connection.release();
    }
};

export const deleteBanner = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM banners WHERE id = $1', [id]);

        const io = global.io;
        if (io) io.emit('banners_updated', { action: 'delete', id });

        res.json({ success: true });
    } catch (error) {
        console.error('deleteBanner Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
