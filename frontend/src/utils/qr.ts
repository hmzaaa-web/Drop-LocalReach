import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { QRPosition, QRSize, QRVisibility } from '../types';

export interface EmbedQrOptions {
  visibility: QRVisibility;
  position: QRPosition;
  size: QRSize;
}

/**
 * Embeds a discreet QR code into a source image onto an HTML Canvas with controlled contrast
 */
export async function embedQrIntoImage(
  imageElement: HTMLImageElement,
  qrText: string,
  options: EmbedQrOptions
): Promise<string> {
  const { visibility, position, size } = options;

  // Create high-resolution working canvas matching original image dimensions
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

  // Determine edge padding
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

  // Generate QR code with High error correction ('H') and 4-module quiet zone margin
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = qrDimension;
  qrCanvas.height = qrDimension;

  await QRCode.toCanvas(qrCanvas, qrText, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: qrDimension,
    color: {
      dark: '#0B0B0B',
      light: '#FFFFFF',
    },
  });

  // Controlled high-contrast composite parameters:
  // - backingAlpha provides a subtle translucent wash behind the QR and its quiet zone
  // - qrAlpha controls the opacity of the QR code itself on top of the wash
  let backingAlpha = 0.60;
  let qrAlpha = 0.70;

  if (visibility === 'standard') {
    backingAlpha = 0.95;
    qrAlpha = 0.95;
  } else if (visibility === 'low-visibility') {
    backingAlpha = 0.45;
    qrAlpha = 0.55;
  } else {
    // 'discreet'
    backingAlpha = 0.60;
    qrAlpha = 0.70;
  }

  ctx.save();

  // 1. Draw subtle light backing panel covering QR + quiet zone
  ctx.globalAlpha = backingAlpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, qrDimension, qrDimension);

  // 2. Draw QR code on top using nearest-neighbor interpolation to preserve crisp module edges
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = qrAlpha;
  ctx.drawImage(qrCanvas, x, y, qrDimension, qrDimension);

  ctx.restore();

  // Export as PNG for lossless representation
  return canvas.toDataURL('image/png');
}

/**
 * Scans an image for a DROP QR code using a multi-pass decoder:
 * PASS A: Direct full-image decode
 * PASS B: Downscaled full-image decode (for very large images)
 * PASS C: High-resolution QR-region crops (bottom-right, bottom-left, top-right, top-left, center)
 * PASS D: Image enhancement (contrast-stretch, local adaptive threshold, inverted threshold)
 * PASS E: Multiple scales (1x, 1.5x)
 */
export async function scanQrFromImage(imageElement: HTMLImageElement): Promise<string | null> {
  const naturalWidth = imageElement.naturalWidth || imageElement.width;
  const naturalHeight = imageElement.naturalHeight || imageElement.height;

  if (!naturalWidth || !naturalHeight) return null;

  console.log(`[DROP Scanner] Scanning image (${naturalWidth}x${naturalHeight})`);
  let attempts = 0;

  const tryDecode = (imageData: ImageData, label: string): string | null => {
    attempts++;
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (code && code.data) {
      const token = extractDropToken(code.data);
      if (token) {
        console.log(`[DROP Scanner] Success at ${label} (attempt #${attempts})`);
        return token;
      }
    }
    return null;
  };

  // Create reusable working canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // PASS A: Direct full-image decode (if within reasonable size limit)
  if (Math.max(naturalWidth, naturalHeight) <= 2000) {
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    ctx.drawImage(imageElement, 0, 0, naturalWidth, naturalHeight);
    const fullData = ctx.getImageData(0, 0, naturalWidth, naturalHeight);

    let res = tryDecode(fullData, 'PASS A: Full image direct');
    if (res) return res;

    // Fast full-image contrast stretch
    const enhancedFull = enhanceContrast(fullData);
    res = tryDecode(enhancedFull, 'PASS A: Full image contrast-stretched');
    if (res) return res;
  }

  // PASS B: Downscaled full-image decode (for very large images e.g. 2000px - 6000px)
  if (Math.max(naturalWidth, naturalHeight) > 1200) {
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(naturalWidth, naturalHeight));
    const targetW = Math.round(naturalWidth * scale);
    const targetH = Math.round(naturalHeight * scale);

    canvas.width = targetW;
    canvas.height = targetH;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(imageElement, 0, 0, targetW, targetH);
    const downscaledData = ctx.getImageData(0, 0, targetW, targetH);

    let res = tryDecode(downscaledData, `PASS B: Downscaled ${targetW}x${targetH}`);
    if (res) return res;

    const enhDownscaled = enhanceContrast(downscaledData);
    res = tryDecode(enhDownscaled, 'PASS B: Downscaled contrast-stretched');
    if (res) return res;
  }

  // PASS C, D, E: High-resolution QR-region crops with enhancement & multi-scale
  const minDim = Math.min(naturalWidth, naturalHeight);
  // Test two crop sizes: a tighter crop (36% minDim) and a more generous crop (54% minDim)
  const cropSizes = [
    Math.min(Math.max(220, Math.round(minDim * 0.36)), minDim),
    Math.min(Math.max(320, Math.round(minDim * 0.54)), minDim),
  ];

  for (const cropSize of cropSizes) {
    const regions = [
      { name: 'bottom-right', x: naturalWidth - cropSize, y: naturalHeight - cropSize },
      { name: 'bottom-left', x: 0, y: naturalHeight - cropSize },
      { name: 'top-right', x: naturalWidth - cropSize, y: 0 },
      { name: 'top-left', x: 0, y: 0 },
      {
        name: 'center',
        x: Math.round((naturalWidth - cropSize) / 2),
        y: Math.round((naturalHeight - cropSize) / 2),
      },
    ];

    for (const reg of regions) {
      // 1. Direct native crop
      canvas.width = cropSize;
      canvas.height = cropSize;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        imageElement,
        reg.x,
        reg.y,
        cropSize,
        cropSize,
        0,
        0,
        cropSize,
        cropSize
      );
      const cropData = ctx.getImageData(0, 0, cropSize, cropSize);

      let res = tryDecode(cropData, `Crop ${reg.name} (${cropSize}px direct)`);
      if (res) return res;

      // 2. Contrast enhanced crop
      const enhancedCrop = enhanceContrast(cropData);
      res = tryDecode(enhancedCrop, `Crop ${reg.name} (${cropSize}px contrast)`);
      if (res) return res;

      // 3. Local adaptive threshold (integral image)
      const win = Math.max(17, Math.round(cropSize / 16) | 1);
      const threshCrop = adaptiveThreshold(cropData, win, 4);
      res = tryDecode(threshCrop, `Crop ${reg.name} (${cropSize}px adaptive-thresh w${win})`);
      if (res) return res;

      // 4. Mean threshold & inverted threshold
      const meanThresh = thresholdImage(enhancedCrop, false);
      res = tryDecode(meanThresh, `Crop ${reg.name} (${cropSize}px mean-thresh)`);
      if (res) return res;

      const invThresh = thresholdImage(enhancedCrop, true);
      res = tryDecode(invThresh, `Crop ${reg.name} (${cropSize}px inv-thresh)`);
      if (res) return res;

      // 5. Scale 1.5x (if crop size is under 600px)
      if (cropSize <= 600) {
        const scaledW = Math.round(cropSize * 1.5);
        const scaledH = Math.round(cropSize * 1.5);
        canvas.width = scaledW;
        canvas.height = scaledH;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          imageElement,
          reg.x,
          reg.y,
          cropSize,
          cropSize,
          0,
          0,
          scaledW,
          scaledH
        );
        const scaledData = ctx.getImageData(0, 0, scaledW, scaledH);

        res = tryDecode(scaledData, `Crop ${reg.name} (1.5x direct)`);
        if (res) return res;

        const enhScaled = enhanceContrast(scaledData);
        res = tryDecode(enhScaled, `Crop ${reg.name} (1.5x contrast)`);
        if (res) return res;

        const winScaled = Math.max(21, Math.round(scaledW / 16) | 1);
        const threshScaled = adaptiveThreshold(scaledData, winScaled, 4);
        res = tryDecode(threshScaled, `Crop ${reg.name} (1.5x adaptive w${winScaled})`);
        if (res) return res;
      }
    }
  }

  console.log(`[DROP Scanner] Scan completed: no DROP token found after ${attempts} attempts`);
  return null;
}

/**
 * Contrast stretching across luminance range
 */
function enhanceContrast(src: ImageData): ImageData {
  const output = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const data = output.data;

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
    const normalized = Math.round(((luma - min) / range) * 255);
    data[i] = normalized;
    data[i + 1] = normalized;
    data[i + 2] = normalized;
    data[i + 3] = 255;
  }

  return output;
}

/**
 * Fast adaptive thresholding using an integral image (O(1) per pixel)
 */
function adaptiveThreshold(src: ImageData, windowSize = 25, c = 4): ImageData {
  const { width, height, data } = src;
  const gray = new Uint8ClampedArray(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  const intW = width + 1;
  const integral = new Float64Array((width + 1) * (height + 1));

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * intW + (x + 1)] = integral[y * intW + (x + 1)] + rowSum;
    }
  }

  const out = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
  const outData = out.data;
  const halfWin = Math.floor(windowSize / 2);

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - halfWin);
    const y1 = Math.min(height, y + halfWin + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - halfWin);
      const x1 = Math.min(width, x + halfWin + 1);

      const count = (x1 - x0) * (y1 - y0);
      const sum =
        integral[y1 * intW + x1] -
        integral[y0 * intW + x1] -
        integral[y1 * intW + x0] +
        integral[y0 * intW + x0];

      const mean = sum / count;
      const pixelVal = gray[y * width + x];
      const binarized = pixelVal > mean - c ? 255 : 0;

      const idx = (y * width + x) * 4;
      outData[idx] = binarized;
      outData[idx + 1] = binarized;
      outData[idx + 2] = binarized;
      outData[idx + 3] = 255;
    }
  }

  return out;
}

/**
 * Mean / global thresholding
 */
function thresholdImage(src: ImageData, invert = false): ImageData {
  const output = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const data = output.data;

  let sum = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const mean = sum / pixelCount;

  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = !invert ? (luma > mean ? 255 : 0) : (luma > mean ? 0 : 255);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
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
  const urlMatch = trimmed.match(/\/f\/([a-zA-Z0-9_-]{16,64})/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Pattern 2: Raw token if user just encoded the token
  if (/^[a-zA-Z0-9_-]{16,64}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
