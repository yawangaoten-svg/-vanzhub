import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth';
import { uploadImage, uploadVideo, uploadImages } from '../middleware/upload';

const router = Router();
const controller = new MediaController();

router.post('/upload', authenticate, uploadImage, controller.uploadImage);
router.post('/upload-multiple', authenticate, uploadImages, controller.uploadMultiple);
router.post('/upload-video', authenticate, uploadVideo, controller.uploadVideo);
router.get('/', authenticate, controller.getUserMedia);
router.delete('/:id', authenticate, controller.deleteMedia);

export default router;
