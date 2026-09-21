import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Image as ImageIcon,
  Download,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';
import { QRPosition, QRSize, QRVisibility } from '../../types';
import { embedQrIntoImage } from '../../utils/qr';
import { getDaysRemaining } from '../../utils/format';

interface ImageShareProps {
  onNotify?: (text: string, type?: 'success' | 'error') => void;
}

export const ImageShare: React.FC<ImageShareProps> = ({ onNotify }) => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data passed from upload flow
  const state = location.state as {
    publicUrl?: string;
    token?: string;
    fileName?: string;
    expiresAt?: string;
  } | null;

  const CANONICAL_BASE_URL = (import.meta.env.VITE_PUBLIC_BASE_URL || 'https://drop.localreach.in').replace(/\/+$/, '');
  const publicUrl = state?.publicUrl || (state?.token ? `${CANONICAL_BASE_URL}/f/${state.token}` : '');
  const fileName = state?.fileName || 'file';
  const expiresAt = state?.expiresAt || new Date(Date.now() + 10 * 86400000).toISOString();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Discreet QR Controls
  const [visibility, setVisibility] = useState<QRVisibility>('discreet');
  const [position, setPosition] = useState<QRPosition>('bottom-right');
  const [size, setSize] = useState<QRSize>('medium');

  // Preview / generated output
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // If no URL/token passed, fallback input prompt
  const [customDropUrl, setCustomDropUrl] = useState(publicUrl);

  const targetUrl = publicUrl || customDropUrl;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectImage(e.target.files[0]);
    }
  };

  const handleSelectImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please upload a valid image (JPG, PNG, or WEBP)', 'error');
      return;
    }
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Re-generate preview whenever options change
  useEffect(() => {
    if (!imageElement || !targetUrl) return;

    let isMounted = true;
    const updatePreview = async () => {
      setIsProcessing(true);
      try {
        const url = await embedQrIntoImage(imageElement, targetUrl, {
          visibility,
          position,
          size,
        });
        if (isMounted) {
          setGeneratedImageUrl(url);
        }
      } catch (err) {
        console.error('Error embedding QR:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    updatePreview();
    return () => {
      isMounted = false;
    };
  }, [imageElement, targetUrl, visibility, position, size]);

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `DROP_${fileName.replace(/\.[^/.]+$/, '')}_discreet_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onNotify) onNotify('Image downloaded with embedded QR', 'success');
  };

  return (
    <div className="flex-1 site-container py-10 md:py-16 w-full animate-fade-in">
      <SEO
        title="Share Image with QR — DROP by LocalReach"
        description="Embed low-visibility QR codes into images for discreet temporary file sharing on DROP by LocalReach."
        canonical="https://drop.localreach.in/share-image"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Header */}
      <div className="mb-8">
        <BackButton fallbackUrl="/upload" className="mb-4" />

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-black mb-2">
          Hide in Image
        </h1>
        <p className="text-sm text-brand-neutral-500 max-w-xl">
          Choose an image and place a low-visibility QR containing your DROP access inside it.
        </p>
      </div>

      {!targetUrl && (
        <div className="glass-card p-4 rounded-brand mb-6 border border-brand-neutral-200">
          <label className="text-xs font-semibold text-brand-black block mb-1">
            DROP Access URL to Embed
          </label>
          <input
            type="text"
            value={customDropUrl}
            onChange={(e) => setCustomDropUrl(e.target.value)}
            placeholder="https://drop.localreach.in/f/XXXXXXXX"
            className="w-full text-xs font-mono px-3 py-2 border rounded-input border-brand-neutral-200"
          />
        </div>
      )}

      {/* Main Container */}
      {!imageElement ? (
        /* Image Selection Drag/Drop */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass-card rounded-card p-12 md:p-16 text-center cursor-pointer border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? 'border-brand-green bg-brand-green/5'
              : 'border-brand-neutral-200/90 hover:border-brand-neutral-500/40 hover:bg-white/90'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-brand-neutral-100 text-brand-neutral-800 mx-auto flex items-center justify-center mb-4">
            <ImageIcon size={24} strokeWidth={2} />
          </div>

          <h2 className="text-lg md:text-xl font-bold text-brand-black tracking-tight mb-1">
            UPLOAD A BASE IMAGE
          </h2>
          <p className="text-sm text-brand-neutral-500 mb-6">
            Drag & drop or <span className="text-brand-green underline underline-offset-4">browse</span>
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-neutral-100 text-xs text-brand-neutral-500">
            <span>Supports JPG, PNG, WEBP</span>
          </div>
        </div>
      ) : (
        /* Steganography Editor & Live Preview */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Visual: Image Preview */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center">
            <div className="glass-card rounded-card p-3 md:p-4 border border-brand-neutral-200/90 bg-white/80 w-full relative overflow-hidden flex items-center justify-center min-h-[340px]">
              {generatedImageUrl ? (
                <div className="relative group max-h-[500px] overflow-hidden rounded-brand flex items-center justify-center">
                  <img
                    src={generatedImageUrl}
                    alt="Discreet QR Preview"
                    className="max-h-[500px] w-auto object-contain rounded-brand shadow-sm"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-xs flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-brand-neutral-500">Processing image...</div>
              )}
            </div>

            <div className="w-full flex items-center justify-between text-xs text-brand-neutral-500 mt-3 px-1">
              <span>Original: {imageFile?.name}</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-brand-green hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw size={12} />
                Replace Image
              </button>
            </div>
          </div>

          {/* Simple, Restrained Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card rounded-card p-6 border border-brand-neutral-200/80 bg-white/85 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-brand-neutral-200/60">
                <Sliders size={16} className="text-brand-green" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-black">
                  Discreet QR Controls
                </h2>
              </div>

              {/* 1. QR Visibility */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-black block">
                  QR Visibility
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-brand-neutral-100/80 rounded-brand text-xs">
                  {(['standard', 'discreet', 'low-visibility'] as QRVisibility[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibility(v)}
                      className={`py-1.5 px-2 rounded-[8px] font-medium capitalize transition-all ${
                        visibility === v
                          ? 'bg-white text-brand-black shadow-xs font-semibold'
                          : 'text-brand-neutral-500 hover:text-brand-black'
                      }`}
                    >
                      {v === 'low-visibility' ? 'Low Vis' : v}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-brand-neutral-500 flex items-start gap-1 pt-1">
                  <AlertTriangle size={12} className="shrink-0 text-brand-neutral-500 mt-0.5" />
                  <span>Very low visibility may make scanning more difficult.</span>
                </p>
              </div>

              {/* 2. QR Position */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-black block">
                  QR Position
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-brand-neutral-100/80 rounded-brand text-xs">
                  {[
                    { id: 'top-left', label: 'Top L' },
                    { id: 'center', label: 'Center' },
                    { id: 'top-right', label: 'Top R' },
                    { id: 'bottom-left', label: 'Bottom L' },
                    { id: 'bottom-right', label: 'Bottom R' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPosition(p.id as QRPosition)}
                      className={`py-1.5 px-2 rounded-[8px] font-medium transition-all ${
                        position === p.id
                          ? 'bg-white text-brand-black shadow-xs font-semibold'
                          : 'text-brand-neutral-500 hover:text-brand-black'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. QR Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-black block">
                  QR Size
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-brand-neutral-100/80 rounded-brand text-xs">
                  {(['small', 'medium', 'large'] as QRSize[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`py-1.5 px-2 rounded-[8px] font-medium capitalize transition-all ${
                        size === s
                          ? 'bg-white text-brand-black shadow-xs font-semibold'
                          : 'text-brand-neutral-500 hover:text-brand-black'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Actions */}
              <div className="pt-4 border-t border-brand-neutral-200/60 space-y-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleDownload}
                  disabled={!generatedImageUrl || isProcessing}
                  className="w-full"
                >
                  <Download size={15} />
                  Download Image
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageElement(null);
                    setImageFile(null);
                    setGeneratedImageUrl(null);
                  }}
                  className="w-full text-xs"
                >
                  Choose Another Image
                </Button>
              </div>

              {/* File Expiration notice */}
              <div className="pt-2 border-t border-brand-neutral-200/40 text-[11px] text-brand-neutral-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-brand-green" />
                  Target file expires:
                </span>
                <span className="font-semibold text-brand-black">
                  {getDaysRemaining(expiresAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
