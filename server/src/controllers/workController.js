import pool from '../config/db.js';

// GET /api/works/:workId/chapters
export const getWorkChapters = async (req, res) => {
    const { workId } = req.params;
    try {
        const [chapters] = await pool.query(
            'SELECT * FROM chapters WHERE work_id = $1 ORDER BY chapter_number ASC',
            [workId]
        );
        res.json(chapters);
    } catch (error) {
        console.error('getWorkChapters Error:', error);
        res.status(500).json({ error: 'Erro ao buscar capítulos' });
    }
};

// GET /api/works/chapters/:id
export const getChapterDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT c.*, w.title as work_title, w.cover_url as work_cover 
            FROM chapters c 
            JOIN works w ON c.work_id = w.id 
            WHERE c.id = $1`, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Chapter not found' });

        const chapter = rows[0];
        const [pages] = await pool.query(
            'SELECT * FROM chapter_images WHERE chapter_id = $1 ORDER BY page_number ASC', [id]);

        res.json({
            chapter,
            pages,
            work_id: chapter.work_id,
            manga_id: chapter.work_id
        });
    } catch (error) {
        console.error('getChapterDetail Error:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do capítulo' });
    }
};

export const getWorks = async (req, res) => {
    const { tags, type, status, q } = req.query;
    try {
        let paramIndex = 1;
        let params = [];
        let conditions = [];

        const typeMap = { 'Mangá': 'manga', 'Manhwa': 'manhwa', 'Manhua': 'manhua' };
        const statusMap = { 'Em andamento': 'ongoing', 'Completo': 'completed' };

        const typeFilter = type === 'Todos' || !type ? null : (typeMap[type] || type.toLowerCase());
        const statusFilter = status === 'Todos' || !status ? null : (statusMap[status] || status);

        if (typeFilter) {
            conditions.push(`w.type = $${paramIndex++}`);
            params.push(typeFilter);
        }

        if (statusFilter) {
            if (statusFilter === 'Em andamento' || statusFilter === 'ongoing') {
                conditions.push("(w.status = 'ongoing' OR w.status = 'Em andamento')");
            } else if (statusFilter === 'Completo' || statusFilter === 'completed') {
                conditions.push("(w.status = 'completed' OR w.status = 'Completo')");
            } else {
                conditions.push(`w.status = $${paramIndex++}`);
                params.push(statusFilter);
            }
        }

        if (q) {
            conditions.push(`(w.title ILIKE $${paramIndex} OR w.author ILIKE $${paramIndex + 1} OR w.artist ILIKE $${paramIndex + 2})`);
            const searchPattern = `%${q}%`;
            params.push(searchPattern, searchPattern, searchPattern);
            paramIndex += 3;
        }

        let query = `
            SELECT w.*, STRING_AGG(t.name, ',') as tags 
            FROM works w 
            LEFT JOIN work_tags wt ON w.id = wt.work_id 
            LEFT JOIN tags t ON wt.tag_id = t.id
        `;

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY w.id';

        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            const tagPlaceholders = tagArray.map((_, i) => `$${paramIndex + i}`).join(',');
            query += ` HAVING SUM(CASE WHEN t.name IN (${tagPlaceholders}) THEN 1 ELSE 0 END) = $${paramIndex + tagArray.length}`;
            params.push(...tagArray, tagArray.length);
            paramIndex += tagArray.length + 1;
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
        const [rows] = await pool.query('SELECT * FROM works WHERE title ILIKE $1', [`%${q}%`]);
        res.json(rows);
    } catch (error) {
        console.error('searchWorks Error:', error);
        res.status(500).json({ error: 'Erro na busca' });
    }
};

export const getWorkDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM works WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Obra não encontrada' });

        // Increment views (non-blocking)
        pool.query('UPDATE works SET views = views + 1 WHERE id = $1', [id]).catch(e => console.error(e));

        const io = global.io;
        if (io) io.emit('work_view', { work_id: id });

        const [ratingRows] = await pool.query('SELECT AVG(rating) as avg_rating FROM ratings WHERE work_id = $1', [id]);
        const avgRating = ratingRows[0].avg_rating || rows[0].rating_cache || 0;

        const [chapters] = await pool.query('SELECT * FROM chapters WHERE work_id = $1 ORDER BY chapter_number DESC', [id]);

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

    const typeMap = { 'Mangá': 'manga', 'Manhwa': 'manhwa', 'Manhua': 'manhua' };
    const statusMap = { 'Em andamento': 'ongoing', 'Completo': 'completed' };
    type = typeMap[type] || type?.toLowerCase() || 'manga';
    status = statusMap[status] || status?.toLowerCase() || 'ongoing';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const cover_url = coverFile ? `/uploads/covers/${coverFile.filename}` : req.body.cover_url;
        const tagList = tags ? (Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim()))).filter(Boolean) : [];

        const [result] = await connection.query(
            'INSERT INTO works (title, description, cover_url, type, status, author, artist) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [title, description, cover_url, type, status, author, artist]
        );
        const workId = result[0].id;

        if (tagList.length > 0) {
            for (const tagName of tagList) {
                let [tagRows] = await connection.query('SELECT id FROM tags WHERE name = $1', [tagName]);
                let tagId;
                if (tagRows.length > 0) {
                    tagId = tagRows[0].id;
                } else {
                    const slug = tagName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const [newTag] = await connection.query('INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id', [tagName, slug]);
                    tagId = newTag[0].id;
                }
                await connection.query('INSERT INTO work_tags (work_id, tag_id) VALUES ($1, $2)', [workId, tagId]);
            }
        }

        try {
            await connection.query('INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
                [req.user?.id, 'create_work', `Obra "${title}" foi adicionada ao catálogo.`]);
        } catch (le) { console.error('Logging error:', le); }

        const files = req.files && req.files['pages'] ? req.files['pages'] : [];
        const { chapter_number, chapter_title } = req.body;

        if (files.length > 0 && chapter_number) {
            const [chapResult] = await connection.query(
                'INSERT INTO chapters (work_id, chapter_number, title) VALUES ($1, $2, $3) RETURNING id',
                [workId, chapter_number, chapter_title || 'Capítulo Inicial']
            );
            const chapterId = chapResult[0].id;

            for (let i = 0; i < files.length; i++) {
                await connection.query(
                    'INSERT INTO chapter_images (chapter_id, image_url, page_number) VALUES ($1, $2, $3)',
                    [chapterId, `/uploads/chapters/${files[i].filename}`, i + 1]
                );
            }
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'create', id: workId, title });

        const [newWorkRows] = await connection.query('SELECT * FROM works WHERE id = $1', [workId]);
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
            'INSERT INTO chapters (work_id, chapter_number, title) VALUES ($1, $2, $3) RETURNING id',
            [workId, chapter_number, title]
        );
        const chapterId = result[0].id;

        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                await connection.query(
                    'INSERT INTO chapter_images (chapter_id, image_url, page_number) VALUES ($1, $2, $3)',
                    [chapterId, `/uploads/chapters/${files[i].filename}`, i + 1]
                );
            }
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'add_chapter', workId, chapter_number });

        const [newChapterRows] = await connection.query('SELECT * FROM chapters WHERE id = $1', [chapterId]);
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
            'UPDATE works SET title = $1, description = $2, author = $3, artist = $4, type = $5, status = $6, cover_url = $7 WHERE id = $8',
            [title, description, author, artist, type, status, cover_url, id]
        );

        if (tags !== undefined) {
            const tagList = tags ? (Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim()))) : [];

            await connection.query('DELETE FROM work_tags WHERE work_id = $1', [id]);

            for (const tagName of tagList) {
                if (!tagName) continue;
                let [tagRows] = await connection.query('SELECT id FROM tags WHERE name = $1', [tagName]);
                let tagId;
                if (tagRows.length > 0) {
                    tagId = tagRows[0].id;
                } else {
                    const slug = tagName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const [newTag] = await connection.query('INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id', [tagName, slug]);
                    tagId = newTag[0].id;
                }
                await connection.query('INSERT INTO work_tags (work_id, tag_id) VALUES ($1, $2)', [id, tagId]);
            }
        }

        await connection.commit();

        const io = global.io;
        if (io) io.emit('works_updated', { action: 'update', id });

        const [updatedWorkRows] = await connection.query('SELECT * FROM works WHERE id = $1', [id]);
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
        await pool.query('DELETE FROM works WHERE id = $1', [id]);

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
        await pool.query('DELETE FROM chapters WHERE id = $1', [id]);

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
            'UPDATE chapters SET chapter_number = $1, title = $2 WHERE id = $3',
            [chapter_number, title, id]
        );

        if (files && files.length > 0) {
            await connection.query('DELETE FROM chapter_images WHERE chapter_id = $1', [id]);

            for (let i = 0; i < files.length; i++) {
                await connection.query(
                    'INSERT INTO chapter_images (chapter_id, image_url, page_number) VALUES ($1, $2, $3)',
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

export const getChapterNeighbors = async (req, res) => {
    const { id } = req.params;
    try {
        const [current] = await pool.query(
            'SELECT id, work_id, chapter_number FROM chapters WHERE id = $1', [id]);
        if (current.length === 0) return res.status(404).json({ error: 'Chapter not found' });

        const { work_id } = current[0];

        const [all] = await pool.query(
            'SELECT id, chapter_number FROM chapters WHERE work_id = $1 ORDER BY chapter_number ASC',
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
