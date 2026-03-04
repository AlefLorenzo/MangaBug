import express from 'express';
import multer from 'multer';
import * as userController from '../controllers/userController.js';
import { auth, anyAuth } from '../middleware/auth.js';

const router = express.Router();

// File upload for avatar
const upload = multer({ storage: multer.memoryStorage() });

// Public / profile view
router.get('/profile/:id', userController.getProfile);
router.get('/leaderboard', async (req, res) => {
    // Proxy to gamification controller
    const { getLeaderboard } = await import('../controllers/gamificationController.js');
    getLeaderboard(req, res);
});

// Protected routes — require auth token
router.get('/me', auth, userController.getCurrentUser);
router.put('/info', auth, userController.updateBasicInfo);
router.put('/avatar', auth, upload.single('avatar'), userController.updateAvatar);
router.put('/preferences', auth, userController.updatePreference);

// Favorites (protected)
router.get('/favorites/:id', userController.getFavorites);
router.post('/favorites', anyAuth, userController.toggleFavorite);

// History (protected)
router.get('/history/:id', userController.getHistory);
router.post('/history', anyAuth, userController.addHistory);
router.delete('/history', anyAuth, userController.clearHistory);
router.delete('/history/:id', anyAuth, userController.deleteHistory);

export default router;
