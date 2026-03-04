import express from 'express';
import * as gamificationController from '../controllers/gamificationController.js';

const router = express.Router();

router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/rank/:userId', gamificationController.getUserRank);
router.get('/achievements/:userId', gamificationController.getAchievements);

export default router;
