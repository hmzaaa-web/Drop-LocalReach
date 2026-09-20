import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Lock,
  Unlock,
  Download,
  Eye,
  AlertCircle,
  Clock,
  ArrowLeft,
  FileQuestion,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';
import {
  getFileMetadata,
  verifyPasscode,
  getDownloadUrl,
  getPreviewUrl,
} from '../../services/api';
import { formatBytes, formatDate, getDaysRemaining } from '../../utils/format';
import { FileDropMetadata } from '../../types';

interface FileAccessProps {
  onNotify?: (text: string, type?: 'success' | 'error') => void;
}

export const FileAccess: React.FC<FileAccessProps> = ({ onNotify }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [metadata, setMetadata] = useState<FileDropMetadata | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  // Passcode unlock states
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [downloadTicket, setDownloadTicket] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // In-browser preview modal/drawer
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoading(true);
      try {
        const data = await getFileMetadata(token);
        setMetadata(data);
      } catch (err: any) {
        if (err.isExpired || err.status === 410) {
          setIsExpired(true);
        } else {
          setIsNotFound(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [token]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !passcode.trim()) {
      setPasscodeError('Please enter the passcode');
      return;
    }

    setIsVerifying(true);
    setPasscodeError('');

    try {
      const response = await verifyPasscode(token, passcode.trim());
      setDownloadTicket(response.downloadTicket);
      setIsUnlocked(true);
      if (onNotify) onNotify('Passcode verified. File unlocked!', 'success');
    } catch (err: any) {
      if (err.isExpired || err.status === 410) {
        setIsExpired(true);
      } else {
        setPasscodeError('INCORRECT PASSCODE. Please check your passcode and try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = () => {
    if (!token || !downloadTicket) return;
    const downloadUrl = getDownloadUrl(token, downloadTicket);
    window.location.href = downloadUrl;
    if (onNotify) onNotify('Download initiated', 'success');
  };

  // Supported preview types
  const isPreviewSupported = (mime: string) => {
    if (!mime) return false;
    return (
      mime.startsWith('image/') ||
      mime.startsWith('video/') ||
      mime.startsWith('audio/') ||
      mime === 'application/pdf' ||
      mime.startsWith('text/')
    );
  };

  // 1. LOADING STATE
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 animate-fade-in">
        <SEO
          title="Access File — DROP by LocalReach"
          description="Secure passcode-protected file download link on DROP by LocalReach."
          robots="noindex, nofollow, noarchive"
        />
        <div className="w-10 h-10 rounded-full border-2 border-brand-green border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-brand-neutral-500">Retrieving DROP...</p>
      </div>
    );
  }

  // 2. EXPIRED STATE: "THIS DROP HAS DISAPPEARED."
  if (isExpired) {
    return (
      <div className="flex-1 site-container py-12 md:py-20 text-center animate-fade-in">
        <SEO
          title="Access File — DROP by LocalReach"
          description="Secure passcode-protected file download link on DROP by LocalReach."
          robots="noindex, nofollow, noarchive"
        />
        <div className="mb-6 flex justify-start">
          <BackButton fallbackUrl="/" />
        </div>

        <div className="glass-card max-w-lg mx-auto rounded-card p-8 md:p-12 border border-brand-neutral-200/80 bg-white/80 space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-neutral-100 text-brand-neutral-500 mx-auto flex items-center justify-center">
            <Clock size={24} strokeWidth={2} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-black">
              THIS DROP HAS DISAPPEARED.
            </h1>
            <p className="text-sm text-brand-neutral-500 leading-relaxed max-w-sm mx-auto">
              This file was automatically deleted after 10 days. Once deleted, files cannot be recovered.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto"
            >
              <ArrowLeft size={14} />
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. INVALID LINK STATE: "DROP NOT FOUND"
  if (isNotFound || !metadata) {
    return (
      <div className="flex-1 site-container py-12 md:py-20 text-center animate-fade-in">
        <SEO
          title="Access File — DROP by LocalReach"
          description="Secure passcode-protected file download link on DROP by LocalReach."
          robots="noindex, nofollow, noarchive"
        />
        <div className="mb-6 flex justify-start">
          <BackButton fallbackUrl="/" />
        </div>

        <div className="glass-card max-w-lg mx-auto rounded-card p-8 md:p-12 border border-brand-neutral-200/80 bg-white/80 space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-neutral-100 text-brand-neutral-500 mx-auto flex items-center justify-center">
            <FileQuestion size={24} strokeWidth={2} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-black">
              DROP NOT FOUND
            </h1>
            <p className="text-sm text-brand-neutral-500 leading-relaxed max-w-sm mx-auto">
              This link is invalid or no longer available. Please verify the URL or ask the sender for a new link.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto"
            >
              <ArrowLeft size={14} />
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. ACTIVE FILE READY (LOCKED OR UNLOCKED)
  return (
    <div className="flex-1 site-container py-12 md:py-18 w-full animate-fade-in">
      <SEO
        title="Access File — DROP by LocalReach"
        description="Secure passcode-protected file download link on DROP by LocalReach."
        robots="noindex, nofollow, noarchive"
      />
      <div className="mb-6">
        <BackButton fallbackUrl="/" />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="text-xl font-bold tracking-tight text-brand-black">DROP</span>
          <span className="text-xs font-medium text-brand-neutral-500">by LocalReach</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-black">
          {isUnlocked ? 'FILE UNLOCKED' : 'FILE READY'}
        </h1>
      </div>

      <div className="glass-card rounded-card p-6 md:p-10 border border-brand-neutral-200/80 bg-white/85 space-y-6">
        {/* File Metadata Card */}
        <div className="p-4 rounded-brand bg-white border border-brand-neutral-200/80 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-brand flex items-center justify-center shrink-0 ${
            isUnlocked ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-neutral-100 text-brand-neutral-800'
          }`}>
            {isUnlocked ? <Unlock size={22} /> : <FileText size={22} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-brand-black truncate">
              {metadata.originalName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-brand-neutral-500 mt-0.5">
              <span>{formatBytes(metadata.size)}</span>
              <span>•</span>
              <span className="truncate max-w-[150px]">{metadata.mimeType}</span>
            </div>
          </div>
        </div>

        {/* LOCKED STATE: PASSCODE FORM */}
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="space-y-5">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-neutral-500 block mb-1">
                Protected by Passcode
              </span>
              <p className="text-xs text-brand-neutral-500">
                Enter the passcode provided by the sender to unlock.
              </p>
            </div>

            <div>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPasscodeError('');
                  }}
                  placeholder="Enter passcode"
                  className="w-full px-4 py-3 rounded-input border border-brand-neutral-200 bg-white text-brand-black text-center text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  autoFocus
                />
              </div>

              {passcodeError && (
                <div className="mt-2.5 p-2.5 rounded-input bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2 justify-center">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{passcodeError}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isVerifying}
              className="w-full"
            >
              <Lock size={15} />
              Unlock File
            </Button>
          </form>
        ) : (
          /* UNLOCKED STATE: DOWNLOAD & PREVIEW */
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 rounded-brand bg-brand-green/10 border border-brand-green/20 text-xs text-brand-black flex items-center gap-2">
              <Unlock size={16} className="text-brand-green shrink-0" />
              <span>Passcode accepted. You now have authorized access.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleDownload}
                className="w-full"
              >
                <Download size={16} />
                Download File
              </Button>

              {isPreviewSupported(metadata.mimeType) ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full"
                >
                  <Eye size={16} />
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </Button>
              ) : (
                <div className="flex items-center justify-center px-4 py-2.5 rounded-input bg-brand-neutral-100/70 border border-brand-neutral-200/60 text-xs text-brand-neutral-500">
                  Preview unavailable for this format
                </div>
              )}
            </div>

            {/* In-browser preview box */}
            {showPreview && downloadTicket && (
              <div className="mt-4 p-3 rounded-brand bg-white border border-brand-neutral-200 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-brand-neutral-200/60 text-xs font-semibold text-brand-neutral-500">
                  <span>In-Browser Preview</span>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="hover:text-brand-black"
                  >
                    Close
                  </button>
                </div>

                {metadata.mimeType.startsWith('image/') && (
                  <img
                    src={getPreviewUrl(token!, downloadTicket)}
                    alt={metadata.originalName}
                    className="max-h-[400px] w-auto mx-auto rounded-input object-contain"
                  />
                )}

                {metadata.mimeType === 'application/pdf' && (
                  <iframe
                    src={getPreviewUrl(token!, downloadTicket)}
                    title={metadata.originalName}
                    className="w-full h-[450px] rounded-input border border-brand-neutral-200"
                  />
                )}

                {metadata.mimeType.startsWith('video/') && (
                  <video
                    controls
                    src={getPreviewUrl(token!, downloadTicket)}
                    className="w-full max-h-[400px] rounded-input"
                  />
                )}

                {metadata.mimeType.startsWith('audio/') && (
                  <audio
                    controls
                    src={getPreviewUrl(token!, downloadTicket)}
                    className="w-full p-2"
                  />
                )}

                {metadata.mimeType.startsWith('text/') && (
                  <iframe
                    src={getPreviewUrl(token!, downloadTicket)}
                    title={metadata.originalName}
                    className="w-full h-[300px] rounded-input border border-brand-neutral-200 font-mono text-xs"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Expiration Countdown Footer */}
        <div className="pt-3 border-t border-brand-neutral-200/60 flex items-center justify-between text-xs text-brand-neutral-500">
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-brand-green" />
            Expires in {getDaysRemaining(metadata.expiresAt)}
          </span>
          <span>{formatDate(metadata.expiresAt)}</span>
        </div>
      </div>
      </div>
    </div>
  );
};
