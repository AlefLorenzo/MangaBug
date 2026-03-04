import pool from '../config/db.js';

// GET /api/works/:workId/chapters — list all chapters for a work
export const getWorkChapters = async (req, res) => {
    const { workId } = req.params;
    try {
        const [chapters] = await pool.query(
            'SELECT * FROM chapters WHERE work_id = ? ORDER BY CAST(chapter_number AS DECIMAL(10,2)) ASC',
            [workId]
        );
        res.json(chapters);
    } catch (error) {
        console.error('getWorkChapters Error:', error);
        res.status(500).json({ error: 'Erro ao buscar capítulos' });
    }
};

// GET /api/works/chapters/:id — single chapter detail (for reader)
export const getChapterDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT c.*, w.title as work_title, w.cover_url as work_cover 
            FROM chapters c 
            JOIN works w ON c.work_id = w.id 
            WHERE c.id = ?`,
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Chapter not found' });

        const chapter = rows[0];

        // Fetch pages from chapter_images table
        const [pages] = await pool.query(
            'SELECT * FROM chapter_images WHERE chapter_id = ? ORDER BY page_number ASC',
            [id]
        );

        res.json({
            chapter,
            pages,
            work_id: chapter.work_id,
            manga_id: chapter.work_id // backward compat alias
        });
    } catch (error) {
        console.error('getChapterDetail Error:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do capítulo' });
    }
};

export const getWorks = async (req, res) => {
    const { tags, type, status, q } = req.query;
    try {
        let query = `
            SELECT w.*, GROUP_CONCAT(t.name) as tags 
            FROM works w 
            LEFT JOIN work_tags wt ON w.id = wt.work_id 
            LEFT JOIN tags t ON wt.tag_id = t.id
        `;
        let params = [];
        let conditions = [];

        // Normalize inputs
        const typeMap = { 'Mangá': 'manga', 'Manhwa': 'manhwa', 'Manhua': 'manhua' };
        const statusMap = { 'Em andamento': 'ongoing', 'Completo': 'completed' };

        const typeFilter = type === 'Todos' || !type ? null : (typeMap[type] || type.toLowerCase());
        const statusFilter = status === 'Todos' || !status ? null : (statusMap[status] || status);

        if (typeFilter) {
            conditions.push('w.type = ?');
            params.push(typeFilter);
        }

        if (statusFilter) {
            // Support both internal "ongoing" and display "Em andamento"
            if (statusFilter === 'Em andamento' || statusFilter === 'ongoing') {
                conditions.push("(w.status = 'ongoing' OR w.status = 'Em andamento')");
            } else if (statusFilter === 'Completo' || statusFilter === 'completed') {
                conditions.push("(w.status = 'completed' OR w.status = 'Completo')");
            } else {
                conditions.push('w.status = ?');
                params.push(statusFilter);
            }
        }

        if (q) {
            conditions.push('(w.title LIKE ? OR w.author LIKE ? OR w.artist LIKE ?)');
            const searchPattern = `%${q}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY w.id';

        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            query += ' HAVING SUM(CASE WHEN t.name IN (?) THEN 1 ELSE 0 END) = ?';
            params.push(tagArray, tagArray.length);
        }

        query += ' ORDER BY w.created_at DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('getWorks Error:', error);
        res.status(500).json({ error: 'Erro ao buscar obras' });
    }
};

export const getTrending = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM works ORDER BY views DESC LIMIT 5');
        res.json(rows);
    } catch (error) {
        console.error('getTrending Error:', error);
        res.status(500).json({ error: 'Erro ao buscar tendências' });
    }
};

export const searchWorks = async (req, res) => {
    const { q } = req.query;
    try {
        const [rows] = await pool.query('SELECT * FROM works WHERE title LIKE ?', [`%${q}%`]);
        res.json(rows);
    } catch (error) {
        console.error('searchWorks Error:', error);
        res.status(500).json({ error: 'Erro na busca' });
    }
};

export const getWorkDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM works WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Obra não encontrada' });

        // Increment views and log (non-blocking)
        pool.query('UPDATE works SET views = views + 1 WHERE id = ?', [id]).catch(e => console.error(e));

        const io = global.io;
        if (io) io.emit('work_view', { work_id: id });

        const [ratingRows] = await pool.query('SELECT AVG(rating) as avg_rating FROM ratings WHERE work_id = ?', [id]);
        const avgRating = ratingRows[0].avg_rating || rows[0].rating_cache || 0;

        const [chapters] = await pool.query('SELECT * FROM chapters WHERE work_id = ? ORDER BY CAST(chapter_number AS DECIMAL(10,2)) DESC', [id]);

        res.json({
            ...rows[0],
            rating: parseFloat(avgRating).toFixed(1),
            chapters
        });
    } catch (error) {
        console.error('getWorkDetail Error:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes da obra' });
    }
};

export const createWork = async (req, res) => {
    const { title, description, author, artist, tags } = req.body;
    let { type, status } = req.body;
    const coverFile = req.files && req.files['cover'] ? req.files['cover'][0] : null;

    // Normalização de ENUMs (PT-BR -> EN)
    const typeMap = { 'Mangá': 'manga', 'Manhwa': 'manhwa', 'Manhua': 'manhua' };
    const statusMap = { 'Em andamento': 'ongoing', 'Completo': 'completed' };
    type = typeMap[type] || type?.toLowerCase() || 'manga';
    status = statusMap[status] || status?.toLowerCase() || 'ongoing';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const cover_url = coverFile ? `/uploads/covers/${coverFile.filename}` : req.body.cover_url;
        // Tag Stabilization: Filter out empty or whitespace-only tags
        const tagList = tags ? (Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim()))).filter(Boolean) : [];

        const [result] = await connection.query(
            'INSERT INTO works (title, description, cover_url, type, status, author, artist) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, cover_url, type, status, author, artist]
        );
        const workId = result.insertId;

        if (tagList.length > 0) {
            for (const tagName of tagList) {
                let [tagRows] = await connection.query('SELECT id FROM tags WHERE name = ?', [tagName]);
                let tagId;
                if (tagRows.length > 0) {
                    tagId = tagRows[0].id;
                } else {
                    const slug = tagName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const [newTag] = await connection.query('INSERT INTO tags (name, slug) VALUES (?, ?)', [tagName, slug]);
                    tagId = newTag.insertId;
                }
                await connection.query('INSERT INTO work_tags (work_id, tag_id) VALUES (?, ?)', [workId, tagId]);
            }
        }

        // Log the activity WITHIN the transaction
        try {
            await connection.query('INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)',
                [req.user?.id, 'create_work', `Obra "${title}" foi adicionada ao catálogo.`]);
        } catch (le) { console.error('Logging error:', le); }

        const files = req.files && req.files['pages'] ? req.files['pages'] : [];
        const { chapter_number, chapter_title } = req.body;

        // Chapter Creation WITHIN the transaction
        if (files.length > 0 && chapter_number) {
            const [chapResult] = await connection.query(
                'INSERT INTO chapters (work_id, chapter_number, title) VALUES (?, ?, ?)',
                [workId, chapter_number, chapter_title || 'Capítulo Inicial']
            );
            const chapterId = chapResult.insertId;

            for (let i = 0; i < files.length; i++) {
                await connection.query(
                    'INSERT INTO chapter_images (chapter_id, image_url, page_number) VALUES (?, ?, ?)',
                    [chapterId, `/uploads/chapters/${files[i].filename}`, i + 1]
                );
            }
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'create', id: workId, title });

        const [newWorkRows] = await connection.query('SELECT * FROM works WHERE id = ?', [workId]);
        res.json({ success: true, message: 'Work created successfully!', work: newWorkRows[0] });
    } catch (error) {
        await connection.rollback();
        console.error('createWork Error:', error);
        res.status(500).json({ error: 'Erro ao criar obra' });
    } finally {
        connection.release();
    }
};

export const addChapter = async (req, res) => {
    const { workId } = req.params;
    const { chapter_number, title } = req.body;
    const files = req.files;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO chapters (work_id, chapter_number, title) VALUES (?, ?, ?)',
            [workId, chapter_number, title]
        );
        const chapterId = result.insertId;

        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                await connection.query(
                    'INSERT INTO chapter_images (chapter_id, image_url, page_number) VALUES (?, ?, ?)',
                    [chapterId, `/uploads/chapters/${files[i].filename}`, i + 1]
                );
            }
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'add_chapter', workId, chapter_number });

        const [newChapterRows] = await connection.query('SELECT * FROM chapters WHERE id = ?', [chapterId]);
        res.json({ success: true, message: 'Chapter added successfully!', chapter: newChapterRows[0] });
    } catch (error) {
        await connection.rollback();
        console.error('addChapter Error:', error);
        res.status(500).json({ error: 'Erro ao adicionar capítulo' });
    } finally {
        connection.release();
    }
};

export const updateWork = async (req, res) => {
    const { id } = req.params;
    const { title, description, author, artist, tags } = req.body;
    let { type, status } = req.body;

    const typeMap = { 'Mangá': 'manga', 'Manhwa': 'manhwa', 'Manhua': 'manhua' };
    const statusMap = { 'Em andamento': 'ongoing', 'Completo': 'completed' };
    type = typeMap[type] || type?.toLowerCase() || 'manga';
    status = statusMap[status] || status?.toLowerCase() || 'ongoing';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const cover_url = req.file ? `/uploads/covers/${req.file.filename}` : req.body.cover_url;

        await connection.query(
            'UPDATE works SET title = ?, description = ?, author = ?, artist = ?, type = ?, status = ?, cover_url = ? WHERE id = ?',
            [title, description, author, artist, type, status, cover_url, id]
        );

        // Update Tags
        if (tags !== undefined) {
            const tagList = tags ? (Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim()))) : [];

            await connection.query('DELETE FROM work_tags WHERE work_id = ?', [id]);

            for (const tagName of tagList) {
                if (!tagName) continue;
                let [tagRows] = await connection.query('SELECT id FROM tags WHERE name = ?', [tagName]);
                let tagId;
                if (tagRows.length > 0) {
                    tagId = tagRows[0].id;
                } else {
                    const slug = tagName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const [newTag] = await connection.query('INSERT INTO tags (name, slug) VALUES (?, ?)', [tagName, slug]);
                    tagId = newTag.insertId;
                }
                await connection.query('INSERT INTO work_tags (work_id, tag_id) VALUES (?, ?)', [id, tagId]);
            }
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'update', id });

        const [updatedWorkRows] = await connection.query('SELECT * FROM works WHERE id = ?', [id]);
        res.json({ success: true, message: 'Work updated!', work: updatedWorkRows[0] });
    } catch (error) {
        await connection.rollback();
        console.error('updateWork Error:', error);
        res.status(500).json({ error: 'Erro ao atualizar obra' });
    } finally {
        connection.release();
    }
};

export const deleteWork = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM works WHERE id = ?', [id]);

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'delete', id });

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('deleteWork Error:', error);
        res.status(500).json({ error: 'Erro ao excluir obra' });
    }
};

export const deleteChapter = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM chapters WHERE id = ?', [id]);

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'delete_chapter', id });

        res.json({ message: 'Chapter deleted successfully' });
    } catch (error) {
        console.error('deleteChapter Error:', error);
        res.status(500).json({ error: 'Erro ao excluir capítulo' });
    }
};

export const updateChapter = async (req, res) => {
    const { id } = req.params;
    const { chapter_number, title } = req.body;
    const files = req.files;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'UPDATE chapters SET chapter_number = ?, title = ? WHERE id = ?',
            [chapter_number, title, id]
        );

        if (files && files.length > 0) {
            // Remove old images from DB
            await connection.query('DELETE FROM chapter_images WHERE chapter_id = ?', [id]);

            // Insert new images
            for (let i = 0; i < files.length; i++) {
                await connection.query(
                    'INSERT INTO chapter_images (chapter_id, image_url, page_number) VALUES (?, ?, ?)',
                    [id, `/uploads/chapters/${files[i].filename}`, i + 1]
                );
            }
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'update_chapter', id });

        res.json({ success: true, message: 'Chapter updated!' });
    } catch (error) {
        await connection.rollback();
        console.error('updateChapter Error:', error);
        res.status(500).json({ error: 'Erro ao atualizar capítulo' });
    } finally {
        connection.release();
    }
};

// GET /api/works/chapters/:id/neighbors — returns prev and next chapter IDs for reader navigation
export const getChapterNeighbors = async (req, res) => {
    const { id } = req.params;
    try {
        const [current] = await pool.query(
            'SELECT id, work_id, chapter_number FROM chapters WHERE id = ?',
            [id]
        );
        if (current.length === 0) return res.status(404).json({ error: 'Chapter not found' });

        const { work_id } = current[0];

        const [all] = await pool.query(
            'SELECT id, chapter_number FROM chapters WHERE work_id = ? ORDER BY CAST(chapter_number AS DECIMAL(10,2)) ASC',
            [work_id]
        );

        const currentIndex = all.findIndex(c => c.id === parseInt(id));
        const prev = currentIndex > 0 ? all[currentIndex - 1] : null;
        const next = currentIndex < all.length - 1 ? all[currentIndex + 1] : null;

        res.json({
            current: current[0],
            prev: prev ? { id: prev.id, chapter_number: prev.chapter_number } : null,
            next: next ? { id: next.id, chapter_number: next.chapter_number } : null,
            work_id
        });
    } catch (error) {
        console.error('getChapterNeighbors Error:', error);
        res.status(500).json({ error: 'Erro ao buscar capítulos adjacentes' });
    }
};
