import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan as ScanIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';
import { scanQrFromImage } from '../../utils/qr';

type ScanState = 'idle' | 'analyzing' | 'success' | 'failure';

interface ScanProps {
  onNotify?: (text: string, type?: 'success' | 'error') => void;
}

export const Scan: React.FC<ScanProps> = ({ onNotify }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recoveredToken, setRecoveredToken] = useState<string | null>(null);

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
      processSelectedImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedImage(e.target.files[0]);
    }
  };

  const processSelectedImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (onNotify) onNotify('Please upload an image file', 'error');
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setScanState('analyzing');

    const img = new Image();
    img.onload = async () => {
      try {
        const token = await scanQrFromImage(img);
        if (token) {
          setRecoveredToken(token);
          setScanState('success');
          if (onNotify) onNotify('DROP access discovered in image', 'success');
        } else {
          setScanState('failure');
        }
      } catch (err) {
        console.error('Scan error:', err);
        setScanState('failure');
      }
    };
    img.onerror = () => {
      setScanState('failure');
    };
    img.src = objectUrl;
  };

  const handleReset = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setRecoveredToken(null);
    setScanState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContinueToAccess = () => {
    if (recoveredToken) {
      navigate(`/f/${recoveredToken}`);
    }
  };

  return (
    <div className="flex-1 site-container py-10 md:py-16 w-full animate-fade-in">
      <SEO
        title="Scan QR Image — DROP by LocalReach"
        description="Scan and detect low-visibility DROP QR codes directly in your browser without third-party tools."
        canonical="https://drop.localreach.in/scan"
      />
      <div className="mb-6">
        <BackButton fallbackUrl="/" />
      </div>

      <div className="max-w-3xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-black mb-2">
          SCAN AN IMAGE
        </h1>
        <p className="text-sm text-brand-neutral-500 max-w-md mx-auto">
          Upload an image created with DROP to recover its temporary file access.
        </p>
      </div>

      {/* STATE 1: IDLE / DROPZONE */}
      {scanState === 'idle' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass-card rounded-card p-12 md:p-16 text-center cursor-pointer border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? 'border-brand-green bg-brand-green/5 scale-[1.01]'
              : 'border-brand-neutral-200/90 hover:border-brand-neutral-500/40 hover:bg-white/90'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-brand-neutral-100 text-brand-neutral-800 mx-auto flex items-center justify-center mb-4 transition-transform hover:scale-105">
            <ScanIcon size={24} strokeWidth={2} />
          </div>

          <h2 className="text-lg md:text-xl font-bold text-brand-black tracking-tight mb-1">
            DROP YOUR IMAGE HERE
          </h2>
          <p className="text-sm text-brand-neutral-500 mb-6">
            or <span className="text-brand-green underline underline-offset-4">choose image</span>
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-neutral-100 text-xs text-brand-neutral-500">
            <span>Supports JPG, PNG, WEBP</span>
          </div>
        </div>
      )}

      {/* STATE 2: ANALYZING (Subtle & Quick, No sci-fi graphics) */}
      {scanState === 'analyzing' && (
        <div className="glass-card rounded-card p-12 text-center border border-brand-neutral-200/80 bg-white/85 animate-fade-in space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-green border-t-transparent animate-spin mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-brand-black tracking-tight mb-1">
              Analyzing image...
            </h2>
            <p className="text-xs text-brand-neutral-500">
              Looking for DROP access...
            </p>
          </div>
        </div>
      )}

      {/* STATE 3: ACCESS FOUND (SUCCESS) */}
      {scanState === 'success' && (
        <div className="glass-card rounded-card p-8 md:p-10 text-center border border-brand-neutral-200/80 bg-white/90 animate-fade-in space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green mx-auto flex items-center justify-center">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-black mb-1">
              ACCESS FOUND
            </h2>
            <p className="text-sm text-brand-neutral-500 max-w-sm mx-auto">
              A DROP access link was found in this image.
            </p>
          </div>

          {imagePreviewUrl && (
            <div className="max-w-xs mx-auto p-2 rounded-brand bg-brand-neutral-50 border border-brand-neutral-200">
              <img
                src={imagePreviewUrl}
                alt="Analyzed source"
                className="rounded-input max-h-48 w-full object-cover"
              />
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleContinueToAccess}
              className="w-full sm:w-auto"
            >
              Continue to File
              <ArrowRight size={15} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              Scan Another
            </Button>
          </div>
        </div>
      )}

      {/* STATE 4: NO DROP ACCESS FOUND (FAILURE) */}
      {scanState === 'failure' && (
        <div className="glass-card rounded-card p-8 md:p-10 text-center border border-brand-neutral-200/80 bg-white/90 animate-fade-in space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-neutral-100 text-brand-neutral-800 mx-auto flex items-center justify-center">
            <AlertCircle size={24} strokeWidth={2} />
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-brand-black mb-1">
              NO DROP ACCESS FOUND
            </h2>
            <p className="text-sm text-brand-neutral-500 max-w-md mx-auto leading-relaxed">
              This image does not contain a DROP access QR that can be recognized.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              <RefreshCw size={14} />
              Try Another Image
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto"
            >
              <ArrowLeft size={14} />
              Back Home
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
