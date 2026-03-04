import express from 'express';
import * as authController from '../controllers/authController.js';
import { anyAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.get('/me', anyAuth, authController.getMe);

export default router;
