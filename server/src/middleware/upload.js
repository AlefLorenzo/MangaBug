import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
];

// File filter to prevent malicious uploads
const imageFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Use: JPG, PNG, WebP, GIF ou AVIF.'), false);
    }
};

const storage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, `../../../uploads/${folder}`)),
    filename: (req, file, cb) => {
        // Sanitize filename to prevent path traversal
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const limits = {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 100 // max 100 files per request (for chapter pages)
};

export const uploadBanner = multer({ storage: storage('banners'), fileFilter: imageFilter, limits });
export const uploadCover = multer({ storage: storage('covers'), fileFilter: imageFilter, limits });
export const uploadChapters = multer({ storage: storage('chapters'), fileFilter: imageFilter, limits });
