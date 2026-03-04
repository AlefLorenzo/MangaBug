import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes in this file are admin-only
router.use(adminOnly);

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/logs', adminController.getLogs);
router.delete('/logs', adminController.clearLogs);
router.get('/profile', adminController.getAdminProfile);

// Banners management
import { uploadBanner } from '../middleware/upload.js';
router.get('/banners', adminController.getBanners);
router.post('/banners', uploadBanner.single('banner'), adminController.addBanner);
router.delete('/banners/:id', adminController.deleteBanner);

export default router;
