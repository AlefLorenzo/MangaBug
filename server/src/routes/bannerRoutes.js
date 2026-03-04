import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as bannerController from '../controllers/bannerController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../../uploads/banners')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/', bannerController.getBanners);
router.post('/', upload.single('banner'), bannerController.createBanner);
router.put('/:id', bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);

export default router;
