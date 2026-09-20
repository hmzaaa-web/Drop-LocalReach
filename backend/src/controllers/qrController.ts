import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { checkQrRateLimit } from '../services/redisService.js';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.toString().split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

export async function generateQrHandler(req: Request, res: Response): Promise<void> {
  try {
    const clientIp = getClientIp(req);
    const rate = await checkQrRateLimit(clientIp);
    if (!rate.success) {
      res.status(429).json({ error: 'Too many QR requests. Please slow down.' });
      return;
    }

    const { text, level = 'M' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for QR generation' });
      return;
    }

    const qrDataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: level as QRCode.QRCodeErrorCorrectionLevel,
      margin: 2,
      width: 400,
      color: {
        dark: '#0B0B0B',
        light: '#FFFFFF',
      },
    });

    res.json({ success: true, qrDataUrl });
  } catch (err) {
    console.error('[QRController] Error generating QR:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
