import pool from '../config/db.js';

export const getLogs = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                l.*, 
                u.username, 
                u.avatar_url 
            FROM logs l 
            LEFT JOIN users u ON l.user_id = u.id 
            ORDER BY l.created_at DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (error) {
        console.error('getLogs Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};

export const clearLogs = async (req, res) => {
    try {
        await pool.query('DELETE FROM logs');
        res.json({ success: true, message: 'Logs cleared successfully' });
    } catch (error) {
        console.error('clearLogs Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};

export const getAdminProfile = async (req, res) => {
    const { id } = req.user;
    try {
        const [rows] = await pool.query('SELECT id, username, email FROM users WHERE id = ? AND is_admin = 1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
        res.json({ ...rows[0], is_admin: true });
    } catch (error) {
        console.error('getAdminProfile Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const [workCount] = await pool.query('SELECT COUNT(*) as total FROM works');
        const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [viewCount] = await pool.query('SELECT SUM(views) as total FROM works');
        const [recentLogs] = await pool.query('SELECT COUNT(*) as total FROM logs WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)');

        // Chart Data mapping (Simulated based on total views)
        const total = viewCount[0].total || 0;
        const statsData = [
            { name: 'Seg', views: Math.floor(total * 0.12) + 20 },
            { name: 'Ter', views: Math.floor(total * 0.15) + 35 },
            { name: 'Qua', views: Math.floor(total * 0.13) + 25 },
            { name: 'Qui', views: Math.floor(total * 0.16) + 40 },
            { name: 'Sex', views: Math.floor(total * 0.18) + 55 },
            { name: 'Sáb', views: Math.floor(total * 0.22) + 80 },
            { name: 'Dom', views: Math.floor(total * 0.20) + 70 },
        ];

        res.json({
            works: workCount[0].total,
            users: userCount[0].total,
            views: total,
            active_today: recentLogs[0].total,
            chartData: statsData
        });
    } catch (error) {
        console.error('getDashboardStats Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};

export const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, email, is_admin, xp, level, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('getUsers Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, error: 'Você não pode excluir sua própria conta root' });
        }
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'Usuário removido com sucesso' });
    } catch (error) {
        console.error('deleteUser Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};

// Banners Controllers
export const getBanners = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, w.title as manga_title 
            FROM banners b 
            LEFT JOIN works w ON b.work_id = w.id 
            ORDER BY b.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('getBanners Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};

export const addBanner = async (req, res) => {
    const { title, subtitle, work_id } = req.body;
    const bannerFile = req.file;
    try {
        if (!bannerFile) return res.status(400).json({ error: 'Arquivo de banner é obrigatório' });

        const image_path = `/uploads/banners/${bannerFile.filename}`;
        const finalWorkId = work_id === '' || work_id === 'null' ? null : work_id;

        await pool.query(
            'INSERT INTO banners (title, subtitle, image_url, work_id, is_active) VALUES (?, ?, ?, ?, ?)',
            [title || 'Destaque', subtitle || '', image_path, finalWorkId, 1]
        );

        const io = global.io;
        if (io) io.emit('banners_updated', { action: 'create' });

        res.json({ success: true, message: 'Banner criado com sucesso' });
    } catch (error) {
        console.error('addBanner Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};

export const deleteBanner = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM banners WHERE id = ?', [id]);

        const io = global.io;
        if (io) io.emit('banners_updated', { action: 'delete', id });

        res.json({ success: true, message: 'Banner removido' });
    } catch (error) {
        console.error('deleteBanner Error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};
