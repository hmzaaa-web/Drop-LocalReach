import { Router } from 'express';
import {
  login,
  logout,
  getSession,
  getOverview,
  getStorage,
  getHealth,
} from '../controllers/adminController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = Router();

// Public auth endpoints
router.post('/login', login);
router.post('/logout', logout);
router.get('/session', getSession);

// Protected dashboard endpoints
router.get('/overview', requireAdminAuth, getOverview);
router.get('/storage', requireAdminAuth, getStorage);
router.get('/health', requireAdminAuth, getHealth);

export default router;
