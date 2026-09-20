import { Router } from 'express';
import { generateQrHandler } from '../controllers/qrController.js';

const router = Router();

router.post('/qr/generate', generateQrHandler);

export default router;
