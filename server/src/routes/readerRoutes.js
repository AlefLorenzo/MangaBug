import express from 'express';
import * as readerController from '../controllers/readerController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/progress/:userId/:mangaId', auth, readerController.getProgress);
router.post('/progress', auth, readerController.updateProgress);
router.post('/complete', auth, readerController.completeChapter);

export default router;
