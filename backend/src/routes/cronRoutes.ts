import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { cleanupExpiredFiles } from '../services/cleanupService.js';

const router = Router();

/**
 * GET /api/cron/cleanup
 * Vercel Cron scheduled endpoint for purging expired drops and abandoned uploads
 */
router.get('/cron/cleanup', async (req: Request, res: Response): Promise<void> => {
  try {
    // Enforce authorization if CRON_SECRET is configured
    if (config.cronSecret) {
      const authHeader = req.headers.authorization;
      const querySecret = req.query.secret as string | undefined;
      const isAuthorized =
        authHeader === `Bearer ${config.cronSecret}` || querySecret === config.cronSecret;

      if (!isAuthorized) {
        res.status(401).json({ error: 'Unauthorized: Invalid cron authorization' });
        return;
      }
    }

    const result = await cleanupExpiredFiles();
    res.json({
      success: true,
      message: 'Cleanup executed successfully',
      ...result,
    });
  } catch (err: any) {
    console.error('[Cron] Cleanup endpoint error:', err?.message || err);
    res.status(500).json({ error: 'Failed to execute cleanup' });
  }
});

export default router;
