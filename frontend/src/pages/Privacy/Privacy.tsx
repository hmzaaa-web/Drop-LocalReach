import React from 'react';
import { Shield, Clock, Lock, Image, Server } from 'lucide-react';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';

export const Privacy: React.FC = () => {
  return (
    <div className="flex-1 site-container py-10 md:py-16 w-full animate-fade-in">
      <SEO
        title="DROP by LocalReach — Privacy Policy"
        description="Read the DROP by LocalReach Privacy Policy. We store zero personal accounts, collect no tracking cookies and enforce strict 10-day automated file lifecycle deletion."
        canonical="https://drop.localreach.in/privacy"
      />
      <div className="mb-6">
        <BackButton fallbackUrl="/" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
      <header className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-green mb-3 block">
          Transparency & Privacy
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-black mb-3">
          Privacy Policy
        </h1>
        <p className="text-xs font-mono text-brand-neutral-500">
          Last updated: [DATE TO BE UPDATED]
        </p>
      </header>

      {/* Policy Content */}
      <div className="space-y-10 text-sm md:text-base text-brand-neutral-800 leading-relaxed">
        {/* Overview */}
        <section className="p-6 rounded-card glass-card border border-brand-neutral-200/80 bg-white/80 space-y-3">
          <h2 className="text-lg font-bold text-brand-black tracking-tight flex items-center gap-2">
            <Shield size={18} className="text-brand-green" />
            Our Approach to Privacy
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            DROP by LocalReach is designed to minimize data collection by design. We do not require accounts, logins, email verification or profile information. The service exists solely to transfer files temporarily between a sender and a recipient.
          </p>
        </section>

        {/* 1. Temporary File Storage */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight flex items-center gap-2">
            <Clock size={16} className="text-brand-green" />
            1. Temporary File Storage & 10-Day Deletion
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            When you upload a file to DROP, it is stored temporarily on private object storage solely for the purpose of enabling recipient access. Every uploaded file is subject to a strict 10-day lifecycle rule.
          </p>
          <p className="text-xs md:text-sm text-brand-neutral-500 leading-relaxed">
            After 10 days (240 hours) from the moment of upload, our automated cleanup worker permanently purges the stored file and all associated database records. Once deleted, files cannot be recovered by anyone, including the DROP team.
          </p>
        </section>

        {/* 2. Passcode Protection */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight flex items-center gap-2">
            <Lock size={16} className="text-brand-green" />
            2. Passcode Protection
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            Every file uploaded to DROP must be protected with a passcode set by the sender.
          </p>
          <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside">
            <li>Passcodes are salted and hashed using bcrypt prior to database storage.</li>
            <li>Plaintext passcodes are never stored, logged or visible in server logs.</li>
            <li>Recipients must provide the matching passcode to unlock and download the file.</li>
          </ul>
        </section>

        {/* 3. Temporary Access Links */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            3. Temporary Access Links
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            Each upload receives a unique, cryptographically random 24-byte identifier token. This token forms the access URL (e.g., <span className="font-mono text-xs">/f/token</span>). Only individuals with both the link and the passcode can access the shared file.
          </p>
        </section>

        {/* 4. Image QR Functionality & Scanner */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight flex items-center gap-2">
            <Image size={16} className="text-brand-green" />
            4. Image QR Placement & Built-in Scanner
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            If you choose to hide an access link within an image using the "Hide in Image" feature, the QR code generation and canvas composition take place entirely in your web browser. The underlying image you provide is processed locally on your client device and is not uploaded to our file servers as part of that operation.
          </p>
          <p className="text-xs md:text-sm text-brand-neutral-500 leading-relaxed">
            Similarly, when you use the "Scan Image" tool, barcode analysis is executed locally inside your browser using JavaScript. The image being analyzed remains on your device.
          </p>
        </section>

        {/* 5. Technical Information & Security */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight flex items-center gap-2">
            <Server size={16} className="text-brand-green" />
            5. Technical Information & Rate Limiting
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            To prevent brute-force attacks against file passcodes and protect system availability, our servers implement automated rate limiting. We log standard technical request metadata (such as IP address, request timestamps and user-agent strings) strictly for operational security, rate-limit enforcement and abuse prevention.
          </p>
          <p className="text-xs md:text-sm text-brand-neutral-500 leading-relaxed">
            We do not employ third-party behavioral tracking cookies, advertising pixels or cross-site analytics scripts.
          </p>
        </section>

        {/* 6. Contact */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            6. Contact Regarding Privacy
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            If you have questions regarding this Privacy Policy or the operational behavior of DROP, please reach out through our <a href="/contact" className="text-brand-black font-semibold hover:text-brand-green underline decoration-brand-neutral-200 underline-offset-4">Contact page</a>.
          </p>
        </section>
      </div>
      </div>
    </div>
  );
};
