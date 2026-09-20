import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Image as ImageIcon,
  Check,
  Clock,
  X,
  RefreshCw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';
import leftArrowSvg from '../../assets/left-arrow.svg';
import { uploadFile } from '../../services/api';
import { formatBytes, formatDate } from '../../utils/format';
import { UploadResponse } from '../../types';

type UploadStep = 'select' | 'protect' | 'uploading' | 'ready';

interface UploadProps {
  onNotify?: (text: string, type?: 'success' | 'error') => void;
}

export const Upload: React.FC<UploadProps> = ({ onNotify }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Passcode state
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');

  // Upload progress / result
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [copied, setCopied] = useState(false);

  // Drag and drop handlers
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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const maxBytes = 100 * 1024 * 1024; // 100MB
    if (file.size > maxBytes) {
      setUploadError('File exceeds maximum size of 100MB');
      return;
    }
    setSelectedFile(file);
    setUploadError('');
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTriggerBrowse = () => {
    fileInputRef.current?.click();
  };

  // Quick passcode generator
  const handleGeneratePasscode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasscode(code);
    setConfirmPasscode(code);
    setPasscodeError('');
  };

  const handleProceedToPasscode = () => {
    if (!selectedFile) return;
    setStep('protect');
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    if (!passcode || passcode.trim().length === 0) {
      setPasscodeError('Please enter a passcode');
      return;
    }

    if (passcode !== confirmPasscode) {
      setPasscodeError('Passcodes do not match');
      return;
    }

    setPasscodeError('');
    setStep('uploading');
    setUploadError('');

    try {
      const response = await uploadFile(selectedFile, passcode.trim());
      setUploadResult(response);
      setStep('ready');
      if (onNotify) onNotify('File uploaded successfully', 'success');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file. Please try again.');
      setStep('protect');
    }
  };

  const handleCopyLink = () => {
    if (!uploadResult) return;
    navigator.clipboard.writeText(uploadResult.publicUrl);
    setCopied(true);
    if (onNotify) onNotify('Share link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2400);
  };

  const handleNativeShare = async () => {
    if (!uploadResult) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DROP: ${uploadResult.file.originalName}`,
          text: `Access file "${uploadResult.file.originalName}" on DROP (passcode protected):`,
          url: uploadResult.publicUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  // Calculate simulated dates for confirmation
  const now = new Date();
  const expireDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex-1 site-container py-10 md:py-16 w-full animate-fade-in">
      <SEO
        title="Upload File — DROP by LocalReach"
        description="Upload a file with passcode protection to generate a temporary, private DROP share link."
        canonical="https://drop.localreach.in/upload"
      />
      <div className="mb-6">
        {step === 'protect' ? (
          <button
            type="button"
            onClick={() => setStep('select')}
            aria-label="Back"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-brand glass-subtle text-xs font-medium text-brand-black border border-brand-neutral-200/80 hover:border-brand-neutral-500/40 hover:bg-white/80 active:scale-[0.98] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          >
            <img
              src={leftArrowSvg}
              alt=""
              aria-hidden="true"
              className="w-3.5 h-3.5 object-contain transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            <span>Back</span>
          </button>
        ) : step === 'select' ? (
          <BackButton fallbackUrl="/" />
        ) : null}
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
        />

      {/* STEP 1: FILE SELECTION */}
      {step === 'select' && (
        <div>
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-black mb-2">
              Upload a File
            </h1>
            <p className="text-sm text-brand-neutral-500">
              Files are passcode-protected and automatically deleted after 10 days.
            </p>
          </div>

          {!selectedFile ? (
            /* Drag and Drop Box */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleTriggerBrowse}
              className={`glass-card rounded-card p-10 md:p-14 text-center cursor-pointer border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? 'border-brand-green bg-brand-green/5 scale-[1.01]'
                  : 'border-brand-neutral-200/90 hover:border-brand-neutral-500/40 hover:bg-white/90'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-brand-neutral-100 text-brand-neutral-800 mx-auto flex items-center justify-center mb-4 transition-transform hover:scale-110">
                <UploadIcon size={24} strokeWidth={2} />
              </div>

              <h2 className="text-lg md:text-xl font-bold text-brand-black tracking-tight mb-1">
                DROP YOUR FILE HERE
              </h2>
              <p className="text-sm text-brand-neutral-500 mb-6">
                or <span className="text-brand-green font-medium underline underline-offset-4">choose a file</span>
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-neutral-100/80 text-xs text-brand-neutral-500 font-medium">
                <span>Any file type up to 100MB</span>
              </div>
            </div>
          ) : (
            /* Selected File State */
            <div className="glass-card rounded-card p-6 md:p-8 border border-brand-neutral-200/80 bg-white/80 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-brand bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-brand-black truncate">
                      {selectedFile.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-brand-neutral-500 mt-0.5">
                      <span>{formatBytes(selectedFile.size)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[180px]">
                        {selectedFile.type || 'Binary Document'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRemoveFile}
                  className="text-brand-neutral-500 hover:text-brand-black p-1.5 rounded-lg hover:bg-brand-neutral-100 transition-colors"
                  title="Remove file"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-brand-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTriggerBrowse}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw size={14} />
                  Replace
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleProceedToPasscode}
                  className="w-full sm:w-auto"
                >
                  Continue
                  <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 rounded-brand bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PROTECT WITH PASSCODE */}
      {step === 'protect' && (
        <div className="glass-card rounded-card p-6 md:p-10 border border-brand-neutral-200/80 bg-white/80 animate-fade-in space-y-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green mx-auto flex items-center justify-center mb-3">
              <Lock size={22} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-brand-black mb-1">
              PROTECT YOUR FILE
            </h2>
            <p className="text-xs md:text-sm text-brand-neutral-500">
              This file can only be accessed with the correct passcode.
            </p>
          </div>

          {/* Passcode Inputs */}
          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-neutral-800">
                  Passcode
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePasscode}
                  className="text-xs text-brand-green font-medium hover:underline"
                >
                  Generate Passcode
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPasscodeError('');
                  }}
                  placeholder="Enter passcode"
                  className="w-full px-4 py-2.5 rounded-input border border-brand-neutral-200 bg-white text-brand-black text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-neutral-500 hover:text-brand-black p-1"
                >
                  {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-neutral-800 block mb-1.5">
                Confirm Passcode
              </label>
              <input
                type={showPasscode ? 'text' : 'password'}
                value={confirmPasscode}
                onChange={(e) => {
                  setConfirmPasscode(e.target.value);
                  setPasscodeError('');
                }}
                placeholder="Confirm your passcode"
                className="w-full px-4 py-2.5 rounded-input border border-brand-neutral-200 bg-white text-brand-black text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green tracking-wide"
              />
            </div>

            {passcodeError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                <AlertCircle size={13} />
                {passcodeError}
              </p>
            )}
          </div>

          {/* Integrated 10-Day Expiration Information */}
          <div className="rounded-brand bg-brand-neutral-50 p-4 border border-brand-neutral-200/80 text-xs text-brand-neutral-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-brand-black">
              <Clock size={14} className="text-brand-green" />
              <span>10-Day Expiration Notice</span>
            </div>
            <p className="text-brand-neutral-500">
              This file will be automatically deleted after 10 days. After deletion, the file cannot be recovered by anyone.
            </p>
            <div className="pt-2 border-t border-brand-neutral-200 flex items-center justify-between text-brand-neutral-500 font-mono text-[11px]">
              <span>Upload: {formatDate(now.toISOString())}</span>
              <span>Expires: {formatDate(expireDate.toISOString())}</span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="pt-4 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setStep('select')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleUploadSubmit}
            >
              Upload & Protect
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: UPLOADING STATE */}
      {step === 'uploading' && (
        <div className="glass-card rounded-card p-12 text-center border border-brand-neutral-200/80 bg-white/80 animate-fade-in space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-green border-t-transparent animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-brand-black tracking-tight">
            Creating your DROP...
          </h2>
          <p className="text-xs text-brand-neutral-500 max-w-sm mx-auto">
            Encrypting passcode hash and transmitting payload securely to object storage.
          </p>
        </div>
      )}

      {/* STEP 4: LINK GENERATED / READY */}
      {step === 'ready' && uploadResult && (
        <div className="glass-card rounded-card p-6 md:p-10 border border-brand-neutral-200/80 bg-white/85 animate-fade-in space-y-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green mx-auto flex items-center justify-center mb-3">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-black mb-1">
              YOUR FILE IS READY
            </h2>
            <p className="text-xs text-brand-neutral-500">
              Share the temporary link directly, or hide it discreetly inside an image.
            </p>
          </div>

          {/* Prominent Temporary Link Container */}
          <div className="p-4 rounded-brand bg-white border border-brand-neutral-200 shadow-sm space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-neutral-500 block">
              Temporary Access Link
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                readOnly
                value={uploadResult.publicUrl}
                className="w-full font-mono text-xs md:text-sm text-brand-black bg-brand-neutral-50 px-3 py-2.5 rounded-input border border-brand-neutral-200/80 focus:outline-none select-all"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-none"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy Link'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNativeShare}
                  className="flex-1 sm:flex-none"
                >
                  <Share2 size={14} />
                  Share
                </Button>
              </div>
            </div>

            <p className="text-xs text-brand-neutral-500 italic">
              Remember: Share the passcode separately for maximum security.
            </p>
          </div>

          {/* File Metadata & Expiration */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-brand bg-brand-neutral-50/80 border border-brand-neutral-200/60 text-xs">
            <div>
              <span className="text-brand-neutral-500 block text-[11px]">Filename</span>
              <span className="font-semibold text-brand-black truncate block">
                {uploadResult.file.originalName}
              </span>
            </div>
            <div>
              <span className="text-brand-neutral-500 block text-[11px]">File Size</span>
              <span className="font-semibold text-brand-black">
                {formatBytes(uploadResult.file.size)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-brand-neutral-500 block text-[11px]">Automatic Deletion</span>
              <span className="font-semibold text-brand-green">
                In 10 days ({formatDate(uploadResult.file.expiresAt)})
              </span>
            </div>
          </div>

          {/* TWO SHARING CHOICES */}
          <div className="pt-2 border-t border-brand-neutral-200/60 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-neutral-500 block text-center">
              Sharing Options
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={handleCopyLink}
                className="glass-subtle p-5 rounded-brand border border-brand-neutral-200 hover:border-brand-green/50 cursor-pointer transition-all hover:bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2 font-bold text-brand-black text-sm">
                    <Share2 size={16} className="text-brand-green" />
                    SHARE LINK
                  </div>
                  <p className="text-xs text-brand-neutral-500 leading-relaxed">
                    Send the generated URL directly to your recipient.
                  </p>
                </div>
                <div className="mt-4 text-xs font-medium text-brand-green">
                  {copied ? '✓ Link Copied' : 'Copy and Share →'}
                </div>
              </div>

              <div
                onClick={() =>
                  navigate('/share-image', {
                    state: {
                      publicUrl: uploadResult.publicUrl,
                      token: uploadResult.token,
                      fileName: uploadResult.file.originalName,
                      expiresAt: uploadResult.file.expiresAt,
                    },
                  })
                }
                className="glass-subtle p-5 rounded-brand border border-brand-neutral-200 hover:border-brand-green/50 cursor-pointer transition-all hover:bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2 font-bold text-brand-black text-sm">
                    <ImageIcon size={16} className="text-brand-green" />
                    HIDE IN IMAGE
                  </div>
                  <p className="text-xs text-brand-neutral-500 leading-relaxed">
                    Embed a discreet low-visibility QR inside a photo or picture.
                  </p>
                </div>
                <div className="mt-4 text-xs font-medium text-brand-green">
                  Launch QR Steganography →
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep('select');
                setSelectedFile(null);
                setPasscode('');
                setConfirmPasscode('');
                setUploadResult(null);
              }}
            >
              Upload Another File
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
