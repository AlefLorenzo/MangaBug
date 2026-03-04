import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as workController from '../controllers/workController.js';
import { adminOnly, auth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer Setup for Work Covers and Chapters
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'cover') {
            cb(null, path.join(__dirname, '../../../uploads/covers'));
        } else {
            cb(null, path.join(__dirname, '../../../uploads/chapters'));
        }
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.get('/', workController.getWorks);
router.get('/trending', workController.getTrending);
router.get('/search', workController.searchWorks);
router.get('/:id', workController.getWorkDetail);

// Admin Protected Routes
router.post('/', adminOnly, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'pages', maxCount: 100 }]), workController.createWork);
router.put('/:id', adminOnly, upload.single('cover'), workController.updateWork);
router.delete('/:id', adminOnly, workController.deleteWork);

// Chapter Routes
router.get('/:workId/chapters', workController.getWorkChapters);
router.post('/:workId/chapters', adminOnly, upload.array('pages', 100), workController.addChapter);
router.delete('/chapters/:id', adminOnly, workController.deleteChapter);
router.put('/chapters/:id', adminOnly, upload.array('pages', 100), workController.updateChapter);

// Single chapter detail (for reader)
router.get('/chapters/:id', workController.getChapterDetail);

// Chapter neighbors — prev/next chapter for in-reader navigation
router.get('/chapters/:id/neighbors', workController.getChapterNeighbors);

export default router;
