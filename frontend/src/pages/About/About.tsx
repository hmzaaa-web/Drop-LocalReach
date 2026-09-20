import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';

export const About: React.FC = () => {
  return (
    <div className="flex-1 site-container py-12 md:py-20 w-full animate-fade-in">
      <SEO
        title="DROP by LocalReach — About"
        description="Learn about DROP by LocalReach — a minimal, privacy-focused temporary file transfer platform built with zero tracking, passcode encryption, and automatic 10-day deletion."
        canonical="https://drop.localreach.in/about"
      />
      <div className="mb-6">
        <BackButton fallbackUrl="/" />
      </div>

      {/* Editorial Header */}
      <header className="mb-16 md:mb-24 max-w-4xl">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-green">
            Editorial
          </span>
          <span className="text-xs text-brand-neutral-500">•</span>
          <span className="text-xs font-medium text-brand-neutral-500">
            LocalReach Studio
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-brand-black leading-[1.1] mb-6">
          Built to make temporary file sharing simple.
        </h1>

        <p className="text-lg md:text-xl text-brand-neutral-800 font-normal leading-relaxed max-w-2xl">
          Most files shared across the internet are only needed for a few days. Yet traditional platforms store them indefinitely, creating lingering digital clutter, tracking risks, and perpetual exposure.
        </p>
      </header>

      {/* Narrative Sections */}
      <div className="space-y-20">
        {/* Story 01: What DROP is */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-10 border-t border-brand-neutral-200/80">
          <div className="md:col-span-4">
            <span className="text-xs font-mono font-bold text-brand-green">01 / CONCEPT</span>
            <h2 className="text-xl font-bold text-brand-black tracking-tight mt-1">
              What DROP Is
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4 text-sm md:text-base text-brand-neutral-800 leading-relaxed">
            <p>
              DROP is a lightweight, purposeful web utility designed for transient file transfer. It eliminates the friction of account registrations, email verifications, passwords to memorize, and administrative dashboards.
            </p>
            <p className="text-brand-neutral-500 text-sm">
              You upload a document, audio file, archive, or media asset; seal it with a temporary passcode; and receive an ephemeral link. After 10 days, the file and all associated metadata dissolve completely from storage.
            </p>
          </div>
        </section>

        {/* Story 02: Why It Exists */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-10 border-t border-brand-neutral-200/80">
          <div className="md:col-span-4">
            <span className="text-xs font-mono font-bold text-brand-green">02 / PURPOSE</span>
            <h2 className="text-xl font-bold text-brand-black tracking-tight mt-1">
              Why It Exists
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4 text-sm md:text-base text-brand-neutral-800 leading-relaxed">
            <p>
              Modern cloud drives encourage endless hoarding. When you only need to send a proof of work, a sensitive invoice, or a high-resolution export to a client or colleague, you shouldn't have to invite them into a shared folder or surrender personal data.
            </p>
            <div className="glass-card p-6 rounded-brand border border-brand-neutral-200/80 bg-white/70">
              <p className="text-sm font-medium text-brand-black italic">
                “True digital hygiene comes not from infinite storage, but from intentional expiration.”
              </p>
            </div>
          </div>
        </section>

        {/* Story 03: Dual Share Architecture */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-10 border-t border-brand-neutral-200/80">
          <div className="md:col-span-4">
            <span className="text-xs font-mono font-bold text-brand-green">03 / STEGANOGRAPHY</span>
            <h2 className="text-xl font-bold text-brand-black tracking-tight mt-1">
              The Discreet QR Method
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4 text-sm md:text-base text-brand-neutral-800 leading-relaxed">
            <p>
              In addition to direct URLs, DROP introduces discreet low-visibility QR embedding. You can take an ordinary photo or artwork and place a semi-transparent QR code inside it.
            </p>
            <p>
              To the naked eye, the image looks natural. The recipient can drop that image into DROP's built-in scanner to extract the temporary access link, unlock it with the passcode, and download their file.
            </p>
          </div>
        </section>

        {/* Story 04: The 10-Day Life Cycle */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-10 border-t border-brand-neutral-200/80">
          <div className="md:col-span-4">
            <span className="text-xs font-mono font-bold text-brand-green">04 / DISAPPEARANCE</span>
            <h2 className="text-xl font-bold text-brand-black tracking-tight mt-1">
              Guaranteed Deletion
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4 text-sm md:text-base text-brand-neutral-800 leading-relaxed">
            <p>
              On the 10th day following upload, our automated cleanup engine unlinks the storage payload and wipes database records.
            </p>
            <p className="text-sm text-brand-neutral-500">
              Anyone visiting the old link is greeted with a peaceful notice: <span className="font-semibold text-brand-black">“This DROP has disappeared.”</span> No backups. No traces. No forgotten storage fees.
            </p>
          </div>
        </section>
      </div>

      {/* Editorial Footnote */}
      <div className="mt-20 pt-10 border-t border-brand-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-xs text-brand-neutral-500">
          A LocalReach Initiative • drop.localreach.in
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-brand-green-hover transition-colors"
        >
          Try DROP now
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
};
