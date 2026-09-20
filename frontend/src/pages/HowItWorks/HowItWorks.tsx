import React from 'react';
import { AlertCircle, Shield, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';

export const HowItWorks: React.FC = () => {
  return (
    <div className="flex-1 site-container py-12 md:py-20 w-full animate-fade-in">
      <SEO
        title="DROP by LocalReach — How It Works"
        description="Understand how DROP works: from direct-to-storage encrypted uploads and passcode security to discreet QR image sharing and automated 10-day purging."
        canonical="https://drop.localreach.in/how-it-works"
      />
      <div className="mb-6">
        <BackButton fallbackUrl="/" />
      </div>

      {/* Header */}
      <header className="mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-green mb-3 block">
          Process & Architecture
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-brand-black mb-4">
          How DROP Works
        </h1>
        <p className="text-base md:text-lg text-brand-neutral-800 max-w-2xl leading-relaxed">
          A step-by-step breakdown of temporary file protection, discreet image steganography, recipient verification, and automated 10-day deletion.
        </p>
      </header>

      {/* Numbered Sections */}
      <div className="space-y-16">
        {/* Step 01 */}
        <section className="relative pl-0 md:pl-16">
          <div className="md:absolute md:left-0 md:top-0 text-2xl md:text-3xl font-mono font-bold text-brand-neutral-500 mb-2 md:mb-0">
            01
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
              Upload a File
            </h2>
            <p className="text-sm md:text-base text-brand-neutral-800 leading-relaxed mb-4">
              Begin by selecting or dragging and dropping your file onto the upload interface.
            </p>
            <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside">
              <li>Supports documents, archives, multimedia, and raw binaries up to 100MB.</li>
              <li>Files are streamed directly to private object storage without intermediate disk storage.</li>
              <li>Instant file validation verifies name safety, size thresholds, and format integrity.</li>
            </ul>
          </div>
        </section>

        {/* Step 02 */}
        <section className="relative pl-0 md:pl-16">
          <div className="md:absolute md:left-0 md:top-0 text-2xl md:text-3xl font-mono font-bold text-brand-neutral-500 mb-2 md:mb-0">
            02
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
              Protect with Passcode
            </h2>
            <p className="text-sm md:text-base text-brand-neutral-800 leading-relaxed mb-4">
              Enter a secret passcode that only you and your recipient know.
            </p>
            <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside mb-6">
              <li>Passcodes are salted and hashed using bcrypt before database storage.</li>
              <li>Plaintext passcodes are never stored or logged on our servers.</li>
              <li>Automated rate-limiting protects files against brute-force guessing attacks.</li>
            </ul>

            {/* Highlight Box: SECURITY */}
            <div className="glass-card p-4 rounded-brand border border-brand-green/20 bg-brand-green/5 flex items-start gap-3">
              <Shield size={18} className="text-brand-green shrink-0 mt-0.5" />
              <div className="text-xs text-brand-black">
                <span className="font-bold uppercase tracking-wider text-brand-green mr-2">Security:</span>
                Access strictly requires the correct passcode. Even if someone obtains your link, they cannot view or download without the code.
              </div>
            </div>
          </div>
        </section>

        {/* Step 03 */}
        <section className="relative pl-0 md:pl-16">
          <div className="md:absolute md:left-0 md:top-0 text-2xl md:text-3xl font-mono font-bold text-brand-neutral-500 mb-2 md:mb-0">
            03
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
              Get Your Secure Link
            </h2>
            <p className="text-sm md:text-base text-brand-neutral-800 leading-relaxed mb-4">
              Upon upload, DROP creates a unique, cryptographically random link.
            </p>
            <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside">
              <li>Links use non-sequential, 24-byte URL-safe cryptographic tokens.</li>
              <li>The database only maintains an HMAC-SHA256 signature of the token.</li>
              <li>Tokens cannot be guessed, enumerated, or reverse-engineered.</li>
            </ul>
          </div>
        </section>

        {/* Step 04 */}
        <section className="relative pl-0 md:pl-16">
          <div className="md:absolute md:left-0 md:top-0 text-2xl md:text-3xl font-mono font-bold text-brand-neutral-500 mb-2 md:mb-0">
            04
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
              Choose How to Share
            </h2>
            <p className="text-sm md:text-base text-brand-neutral-800 leading-relaxed mb-4">
              DROP provides two distinct sharing workflows:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="glass-subtle p-5 rounded-brand border border-brand-neutral-200">
                <h3 className="text-sm font-bold text-brand-black mb-1">Option A: Direct Link</h3>
                <p className="text-xs text-brand-neutral-500 leading-relaxed">
                  Copy the temporary link and send it via your favorite chat, email, or messaging platform. Share the passcode through a separate channel.
                </p>
              </div>

              <div className="glass-subtle p-5 rounded-brand border border-brand-neutral-200">
                <h3 className="text-sm font-bold text-brand-black mb-1">Option B: Hide in Image</h3>
                <p className="text-xs text-brand-neutral-500 leading-relaxed">
                  Upload an ordinary image. DROP embeds a discreet, low-visibility QR code containing the link inside the image without ruining its visual quality.
                </p>
              </div>
            </div>

            {/* Highlight Box: NOTE */}
            <div className="glass-card p-4 rounded-brand border border-brand-neutral-200 bg-white/70 flex items-start gap-3">
              <Info size={18} className="text-brand-neutral-800 shrink-0 mt-0.5" />
              <div className="text-xs text-brand-black">
                <span className="font-bold uppercase tracking-wider text-brand-neutral-800 mr-2">Note:</span>
                Discreet visibility balances subtlety with scannability. Choosing very low visibility reduces visual prominence but may require higher contrast for third-party cameras.
              </div>
            </div>
          </div>
        </section>

        {/* Step 05 */}
        <section className="relative pl-0 md:pl-16">
          <div className="md:absolute md:left-0 md:top-0 text-2xl md:text-3xl font-mono font-bold text-brand-neutral-500 mb-2 md:mb-0">
            05
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
              Recipient Opens DROP
            </h2>
            <p className="text-sm md:text-base text-brand-neutral-800 leading-relaxed mb-4">
              The recipient opens the DROP destination via their preferred method:
            </p>
            <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside">
              <li><strong>Direct Link:</strong> Clicking the URL lands immediately on the secure file unlock screen.</li>
              <li><strong>Image Scan:</strong> Uploading the received picture to DROP's built-in image scanner automatically detects the hidden QR and redirects to the file.</li>
            </ul>
          </div>
        </section>

        {/* Step 06 */}
        <section className="relative pl-0 md:pl-16">
          <div className="md:absolute md:left-0 md:top-0 text-2xl md:text-3xl font-mono font-bold text-brand-neutral-500 mb-2 md:mb-0">
            06
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
              Enter Passcode
            </h2>
            <p className="text-sm md:text-base text-brand-neutral-800 leading-relaxed mb-4">
              Before a byte of data is transferred, the recipient must provide the secret passcode.
            </p>
            <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside">
              <li>File metadata (name, size, type) is displayed cleanly.</li>
              <li>No preview or download streams are accessible prior to passcode verification.</li>
            </ul>
          </div>
        </section>

        {/* Step 07 */}
        <section className="relative pl-0 md:pl-16">
          <div className="md:absolute md:left-0 md:top-0 text-2xl md:text-3xl font-mono font-bold text-brand-neutral-500 mb-2 md:mb-0">
            07
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
              View or Download
            </h2>
            <p className="text-sm md:text-base text-brand-neutral-800 leading-relaxed mb-4">
              Once unlocked, the recipient can download the file or preview supported media.
            </p>
            <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside">
              <li>In-browser previews for PDFs, standard images, audio, video, and text documents.</li>
              <li>Unsupported formats cleanly display a direct download button.</li>
            </ul>
          </div>
        </section>

        {/* Step 08 */}
        <section className="relative pl-0 md:pl-16">
          <div className="md:absolute md:left-0 md:top-0 text-2xl md:text-3xl font-mono font-bold text-brand-neutral-500 mb-2 md:mb-0">
            08
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-black tracking-tight mb-2">
              Automatic Deletion
            </h2>
            <p className="text-sm md:text-base text-brand-neutral-800 leading-relaxed mb-4">
              All files are on a 10-day countdown timer from the moment of upload.
            </p>
            <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside mb-6">
              <li>After 10 days, the storage object is unlinked and completely destroyed.</li>
              <li>Metadata records are removed from the database.</li>
              <li>Subsequent visits will display the permanent message: “This DROP has disappeared.”</li>
            </ul>

            {/* Highlight Box: IMPORTANT */}
            <div className="glass-card p-4 rounded-brand border border-brand-neutral-200 bg-brand-neutral-100/60 flex items-start gap-3">
              <AlertCircle size={18} className="text-brand-neutral-800 shrink-0 mt-0.5" />
              <div className="text-xs text-brand-black">
                <span className="font-bold uppercase tracking-wider text-brand-black mr-2">Important:</span>
                Your file will be permanently deleted after 10 days. Once deleted, the file cannot be restored by anyone.
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="mt-16 pt-10 border-t border-brand-neutral-200/80 flex justify-center">
        <Link to="/upload">
          <Button variant="primary" size="lg">
            Upload a File Now
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
};
