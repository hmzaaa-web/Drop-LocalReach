import { Router } from 'express';
import {
  createUploadUrlHandler,
  completeUploadHandler,
  getFileMetadataHandler,
  verifyPasscodeHandler,
  downloadFileHandler,
  previewFileHandler,
} from '../controllers/fileController.js';

const router = Router();

// Step 1: Request presigned Backblaze B2 upload URL
router.post('/files/upload-url', createUploadUrlHandler);

// Step 2: Complete and verify upload after direct B2 PUT
router.post('/files/complete', completeUploadHandler);

// Public file metadata lookup
router.get('/files/:token', getFileMetadataHandler);

// Passcode verification
router.post('/files/:token/verify', verifyPasscodeHandler);

// Authorized file download (redirects to short-lived presigned B2 URL)
router.get('/files/:token/download', downloadFileHandler);

// Authorized in-browser preview (redirects to short-lived presigned B2 URL)
router.get('/files/:token/preview', previewFileHandler);

export default router;
