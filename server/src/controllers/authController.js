import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET_USER = process.env.JWT_SECRET_USER || 'user_secret_2026';
const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || 'admin_secret_2026';

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
        }

        const [existing] = await pool.query('SELECT username, email FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existing.length > 0) {
            const isEmail = existing.some(u => u.email === email);
            return res.status(400).json({
                success: false,
                message: isEmail ? 'Este e-mail já está em uso.' : 'Este nome de usuário já está em uso.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
        );
        res.status(201).json({ success: true, message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao cadastrar usuário.' });
    }
};

export const login = async (req, res) => {
    const { email, loginIdentifier, password } = req.body;
    const identifier = email || loginIdentifier;

    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [identifier, identifier]
        );

        if (users.length === 0) return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Senha incorreta.' });

        const token = jwt.sign({ id: user.id, is_admin: user.is_admin === 1 }, JWT_SECRET_USER, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin === 1,
                avatar_url: user.avatar_url,
                xp: user.xp,
                level: user.level
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor de login.' });
    }
};

export const adminLogin = async (req, res) => {
    const { email, loginIdentifier, password } = req.body;
    const identifier = email || loginIdentifier;

    try {
        const [admins] = await pool.query(
            'SELECT * FROM users WHERE (email = $1 OR username = $2) AND is_admin = 1',
            [identifier, identifier]
        );

        if (admins.length === 0) return res.status(401).json({ success: false, message: 'Admin não encontrado.' });

        const admin = admins[0];
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Senha incorreta.' });

        const token = jwt.sign({ id: admin.id, is_admin: true }, JWT_SECRET_ADMIN, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { id: admin.id, username: admin.username, email: admin.email, is_admin: true, avatar_url: admin.avatar_url }
        });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor de admin.' });
    }
};

export const getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, is_admin, avatar_url, xp, level FROM users WHERE id = $1',
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

        const user = users[0];
        res.json({
            ...user,
            is_admin: user.is_admin === 1
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
