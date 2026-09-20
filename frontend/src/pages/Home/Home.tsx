import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Scan, Lock, Share2, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '../../components/Button';
import { SEO } from '../../components/SEO';
import dropLogo from '../../assets/logo.png';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 site-container py-8 md:py-14 w-full animate-fade-in">
      <SEO
        title="DROP by LocalReach — Secure Temporary File Sharing"
        description="Securely share files with temporary links and passcode protection. Upload a file, generate a private DROP link, and share it easily. Files automatically disappear after 10 days."
        canonical="https://drop.localreach.in/"
      />
      {/* Brand & Opening Statement */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <img src={dropLogo} alt="DROP by LocalReach" className="w-8 h-8 md:w-9 md:h-9 object-contain" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-brand-black">
              DROP
            </span>
            <span className="text-sm font-semibold text-brand-neutral-500 tracking-wider">
              by LocalReach
            </span>
          </div>
        </div>
        <p className="text-base md:text-lg text-brand-neutral-800 font-normal leading-relaxed">
          Temporary file sharing, protected by passcode.
          <br className="hidden sm:inline" />
          Share directly via link, or discreetly hidden within an image.
        </p>
      </div>

      {/* Primary Action Cards - Two Core Destinations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16 md:mb-20">
        {/* Card 1: UPLOAD FILE */}
        <div
          onClick={() => navigate('/upload')}
          className="glass-card action-card-hover rounded-card p-8 md:p-10 flex flex-col justify-between cursor-pointer border border-brand-neutral-200/80 bg-white/75 relative group"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-brand bg-brand-green/10 text-brand-green flex items-center justify-center transition-transform group-hover:scale-105">
              <Upload size={22} strokeWidth={2.2} />
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
                UPLOAD FILE
              </h2>
              <p className="text-sm text-brand-neutral-800 leading-relaxed max-w-lg">
                Share a temporary file securely. Upload your file, set a passcode, and get a shareable link.
              </p>
            </div>
          </div>

          <div className="pt-8 flex items-center justify-between">
            <Button
              variant="primary"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/upload');
              }}
              className="w-full sm:w-auto"
            >
              Upload File
              <ArrowRight size={15} />
            </Button>
            <span className="text-xs text-brand-neutral-500 hidden sm:inline">
              Up to 100MB
            </span>
          </div>
        </div>

        {/* Card 2: SCAN IMAGE */}
        <div
          onClick={() => navigate('/scan')}
          className="glass-card action-card-hover rounded-card p-8 md:p-10 flex flex-col justify-between cursor-pointer border border-brand-neutral-200/80 bg-white/75 relative group"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-brand bg-brand-neutral-100 text-brand-neutral-800 flex items-center justify-center transition-transform group-hover:scale-105">
              <Scan size={22} strokeWidth={2.2} />
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
                SCAN IMAGE
              </h2>
              <p className="text-sm text-brand-neutral-800 leading-relaxed max-w-lg">
                Recover a DROP from an image. Upload an image created by DROP and scan it for its hidden access QR.
              </p>
            </div>
          </div>

          <div className="pt-8 flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/scan');
              }}
              className="w-full sm:w-auto hover:border-brand-green/40"
            >
              Scan Image
              <ArrowRight size={15} />
            </Button>
            <span className="text-xs text-brand-neutral-500 hidden sm:inline">
              Built-in decoder
            </span>
          </div>
        </div>
      </div>

      {/* Supporting Section: HOW TO USE DROP (Compact 4-step) */}
      <section className="mb-14 border-t border-brand-neutral-200/60 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-neutral-500">
            How to use DROP
          </h3>
          <span className="text-xs text-brand-neutral-500">
            Simple 4-step process
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Step 01 */}
          <div className="glass-subtle instruction-card-hover rounded-brand p-5 border border-brand-neutral-200/60 cursor-default">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-brand-green">01</span>
              <Upload size={14} className="text-brand-neutral-500" />
            </div>
            <h4 className="text-sm font-semibold text-brand-black mb-1">Upload</h4>
            <p className="text-xs text-brand-neutral-500 leading-relaxed">
              Select or drop any file to create a temporary share.
            </p>
          </div>

          {/* Step 02 */}
          <div className="glass-subtle instruction-card-hover rounded-brand p-5 border border-brand-neutral-200/60 cursor-default">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-brand-green">02</span>
              <Lock size={14} className="text-brand-neutral-500" />
            </div>
            <h4 className="text-sm font-semibold text-brand-black mb-1">Protect</h4>
            <p className="text-xs text-brand-neutral-500 leading-relaxed">
              Set a secret passcode required to unlock and download.
            </p>
          </div>

          {/* Step 03 */}
          <div className="glass-subtle instruction-card-hover rounded-brand p-5 border border-brand-neutral-200/60 cursor-default">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-brand-green">03</span>
              <Share2 size={14} className="text-brand-neutral-500" />
            </div>
            <h4 className="text-sm font-semibold text-brand-black mb-1">Share</h4>
            <p className="text-xs text-brand-neutral-500 leading-relaxed">
              Send the direct link or hide it inside an image discreetly.
            </p>
          </div>

          {/* Step 04 */}
          <div className="glass-subtle instruction-card-hover rounded-brand p-5 border border-brand-neutral-200/60 cursor-default">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-brand-green">04</span>
              <ShieldCheck size={14} className="text-brand-neutral-500" />
            </div>
            <h4 className="text-sm font-semibold text-brand-black mb-1">Access</h4>
            <p className="text-xs text-brand-neutral-500 leading-relaxed">
              Recipient enters passcode, previews, and downloads.
            </p>
          </div>
        </div>
      </section>

      {/* 10-Day Essential Product Rule Banner */}
      <div className="rounded-brand bg-brand-neutral-100/70 border border-brand-neutral-200/80 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-brand-neutral-800 shrink-0" />
          <p className="text-xs sm:text-sm text-brand-neutral-800">
            <span className="font-semibold text-brand-black">10-Day Rule:</span> Files are automatically deleted after 10 days. Once deleted, they cannot be recovered.
          </p>
        </div>
        <span className="text-xs font-medium text-brand-green shrink-0 hidden sm:inline">
          Auto-Purge
        </span>
      </div>
    </div>
  );
};
