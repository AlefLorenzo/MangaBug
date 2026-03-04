import jwt from 'jsonwebtoken';

const JWT_SECRET_USER = process.env.JWT_SECRET_USER || 'user_secret_2026';
const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || 'admin_secret_2026';

export const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET_USER);
        req.user = decoded;
        next();
    } catch (error) {
        // Try admin secret if user fails? No, prompt says total separation.
        // If it's a user route, it must be a user token.
        res.status(401).json({ message: 'Token is not valid for user' });
    }
};

export const adminOnly = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, access denied' });

    try {
        let decoded;
        try {
            // Try admin secret first
            decoded = jwt.verify(token, JWT_SECRET_ADMIN);
        } catch (e) {
            // Then try user secret
            decoded = jwt.verify(token, JWT_SECRET_USER);
        }

        if (!decoded.is_admin) {
            return res.status(403).json({ message: 'Access denied: User is not an admin' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Access denied: Invalid or expired token' });
    }
};
export const anyAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        // Try user secret first
        try {
            const decoded = jwt.verify(token, JWT_SECRET_USER);
            req.user = decoded;
            return next();
        } catch (e) {
            // If user secret fails, try admin secret
            const decoded = jwt.verify(token, JWT_SECRET_ADMIN);
            req.user = decoded;
            return next();
        }
    } catch (error) {
        res.status(401).json({ message: 'Token is invalid' });
    }
};
