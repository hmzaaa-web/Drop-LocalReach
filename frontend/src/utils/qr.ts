import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { QRPosition, QRSize, QRVisibility } from '../types';

export interface EmbedQrOptions {
  visibility: QRVisibility;
  position: QRPosition;
  size: QRSize;
}

/**
 * Embeds a discreet QR code into a source image onto an HTML Canvas
 */
export async function embedQrIntoImage(
  imageElement: HTMLImageElement,
  qrText: string,
  options: EmbedQrOptions
): Promise<string> {
  const { visibility, position, size } = options;

  // Create high-resolution working canvas
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth || imageElement.width;
  canvas.height = imageElement.naturalHeight || imageElement.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2d canvas context');

  // Draw original image with 100% fidelity
  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  // Determine QR size relative to image dimensions
  const minDim = Math.min(canvas.width, canvas.height);
  let sizeFactor = 0.25; // default medium
  if (size === 'small') sizeFactor = 0.18;
  if (size === 'large') sizeFactor = 0.35;

  let qrDimension = Math.round(minDim * sizeFactor);
  // Ensure minimum size for decodability
  qrDimension = Math.max(qrDimension, 160);
  // Ensure maximum size doesn't exceed image bounds
  qrDimension = Math.min(qrDimension, Math.round(minDim * 0.85));

  // Determine quiet zone padding
  const padding = Math.max(16, Math.round(minDim * 0.03));

  let x = padding;
  let y = padding;

  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-right':
      x = canvas.width - qrDimension - padding;
      y = padding;
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - qrDimension - padding;
      break;
    case 'bottom-right':
      x = canvas.width - qrDimension - padding;
      y = canvas.height - qrDimension - padding;
      break;
    case 'center':
      x = Math.round((canvas.width - qrDimension) / 2);
      y = Math.round((canvas.height - qrDimension) / 2);
      break;
  }

  // Generate QR code on temporary canvas
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = qrDimension;
  qrCanvas.height = qrDimension;

  await QRCode.toCanvas(qrCanvas, qrText, {
    errorCorrectionLevel: 'M', // medium resilience
    margin: 2,
    width: qrDimension,
    color: {
      dark: '#0B0B0B',
      light: '#FFFFFF',
    },
  });

  // Calculate opacity based on visibility mode
  // Notice: We maintain proper decodable edges while looking discreet
  let alpha = 0.34; // default discreet
  if (visibility === 'standard') {
    alpha = 0.90;
  } else if (visibility === 'low-visibility') {
    alpha = 0.22;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  // Blend QR code onto background
  ctx.drawImage(qrCanvas, x, y, qrDimension, qrDimension);
  ctx.restore();

  // Export as PNG for lossless representation
  return canvas.toDataURL('image/png');
}

/**
 * Scans an image for a DROP QR code using client-side jsQR with adaptive contrast enhancement
 */
export async function scanQrFromImage(imageElement: HTMLImageElement): Promise<string | null> {
  const canvas = document.createElement('canvas');
  const width = imageElement.naturalWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.height;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(imageElement, 0, 0, width, height);
  let imageData = ctx.getImageData(0, 0, width, height);

  // Pass 1: Direct decode
  let code = jsQR(imageData.data, width, height, {
    inversionAttempts: 'attemptBoth',
  });

  if (code && code.data) {
    return extractDropToken(code.data);
  }

  // Pass 2: Contrast stretching & threshold optimization for low-visibility QR
  const enhancedData = enhanceContrast(imageData);
  code = jsQR(enhancedData.data, width, height, {
    inversionAttempts: 'attemptBoth',
  });

  if (code && code.data) {
    return extractDropToken(code.data);
  }

  return null;
}

/**
 * Helper to enhance contrast for semi-transparent QR modules
 */
function enhanceContrast(src: ImageData): ImageData {
  const output = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const data = output.data;

  // Find min and max luminance
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (luma < min) min = luma;
    if (luma > max) max = luma;
  }

  const range = max - min || 1;

  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const normalized = ((luma - min) / range) * 255;
    // Binarize / steepen contrast curve
    const highContrast = normalized > 128 ? 255 : 0;
    data[i] = highContrast;
    data[i + 1] = highContrast;
    data[i + 2] = highContrast;
  }

  return output;
}

/**
 * Helper to parse DROP URL or token from raw QR payload
 */
export function extractDropToken(rawText: string): string | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();

  // Pattern 1: Full URL e.g. https://drop.localreach.in/f/XXXXXXXX
  const urlMatch = trimmed.match(/\/f\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Pattern 2: Raw token if user just encoded the token
  if (/^[a-zA-Z0-9_-]{16,64}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
