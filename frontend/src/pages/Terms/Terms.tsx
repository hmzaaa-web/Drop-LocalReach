import React from 'react';
import { AlertTriangle, Clock, Lock } from 'lucide-react';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';

export const Terms: React.FC = () => {
  return (
    <div className="flex-1 site-container py-10 md:py-16 w-full animate-fade-in">
      <SEO
        title="DROP by LocalReach — Terms of Service"
        description="Read the Terms of Service for DROP by LocalReach. Guidelines and acceptable use policies for temporary, passcode-protected file transfers."
        canonical="https://drop.localreach.in/terms"
      />
      <div className="mb-6">
        <BackButton fallbackUrl="/" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
      <header className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-green mb-3 block">
          Legal Agreement
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-black mb-3">
          Terms & Conditions
        </h1>
        <p className="text-xs font-mono text-brand-neutral-500">
          Last updated: [DATE TO BE UPDATED]
        </p>
      </header>

      {/* Terms Content */}
      <div className="space-y-10 text-sm md:text-base text-brand-neutral-800 leading-relaxed">
        {/* 1. Acceptance of Terms */}
        <section className="space-y-3">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            1. Acceptance of Terms
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            By accessing or using DROP by LocalReach ("DROP", "the Service"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        {/* 2. How DROP Works */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            2. How DROP Works
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            DROP provides temporary, passcode-protected file sharing. Users can upload a file, set a passcode, and generate an ephemeral sharing link or discreetly embed the link inside an image.
          </p>
        </section>

        {/* 3. Temporary File Storage */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            3. Temporary File Storage
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            DROP is strictly a temporary transit utility, not a permanent backup or archival solution. Files are stored on private object storage only for the duration of their active lifecycle (up to 10 days). You are responsible for retaining your own permanent copies of any content you upload.
          </p>
        </section>

        {/* 4. Automatic 10-Day Deletion */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight flex items-center gap-2">
            <Clock size={16} className="text-brand-green" />
            4. Automatic 10-Day Deletion
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            All files and associated database records are automatically and permanently deleted 10 days after upload. Once a file is purged by the automated cleanup service, it cannot be recovered, restored, or accessed under any circumstances.
          </p>
        </section>

        {/* 5. Passcode Responsibility */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight flex items-center gap-2">
            <Lock size={16} className="text-brand-green" />
            5. Passcode Responsibility
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            Passcodes are hashed using one-way cryptographic algorithms. DROP does not store plaintext passcodes and cannot reset, recover, or bypass forgotten passcodes. You are solely responsible for remembering the passcode and communicating it securely to your intended recipient.
          </p>
        </section>

        {/* 6. Prohibited Use */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight flex items-center gap-2">
            <AlertTriangle size={16} className="text-brand-green" />
            6. Prohibited Use
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            You agree not to upload, transmit, or distribute through DROP any content that:
          </p>
          <ul className="space-y-2 text-xs md:text-sm text-brand-neutral-500 list-disc list-inside">
            <li>Is illegal, fraudulent, harmful, or promotes unlawful activity.</li>
            <li>Contains malware, viruses, trojans, ransomware, or malicious payloads.</li>
            <li>Infringes on copyrights, trademarks, trade secrets, or other intellectual property rights.</li>
            <li>Attempts to bypass or circumvent rate limits, security boundaries, or system safeguards.</li>
          </ul>
        </section>

        {/* 7. User Responsibility */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            7. User Responsibility
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            You retain sole ownership of and responsibility for the files you upload. You warrant that you have all necessary rights and permissions to share the files you transfer via DROP.
          </p>
        </section>

        {/* 8. File Sharing and Access */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            8. File Sharing and Access
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            Anyone in possession of both an active file link (or scanned QR image) and the corresponding passcode will be able to download the file. You are responsible for distributing links and passcodes only to your intended recipients.
          </p>
        </section>

        {/* 9. Service Availability */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            9. Service Availability
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            DROP is provided on an "as is" and "as available" basis without warranties of any kind. While we aim for reliable service operation, we do not guarantee uninterrupted availability, error-free uptime, or indefinite service continuation.
          </p>
        </section>

        {/* 10. Changes to the Service */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            10. Changes to the Service
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            We reserve the right to modify, suspend, or discontinue any aspect of the service at any time with or without notice.
          </p>
        </section>

        {/* 11. Contact */}
        <section className="space-y-3 pt-6 border-t border-brand-neutral-200/60">
          <h2 className="text-base md:text-lg font-bold text-brand-black tracking-tight">
            11. Contact
          </h2>
          <p className="text-xs md:text-sm text-brand-neutral-800 leading-relaxed">
            For questions regarding these Terms & Conditions, please contact us via our <a href="/contact" className="text-brand-black font-semibold hover:text-brand-green underline decoration-brand-neutral-200 underline-offset-4">Contact page</a>.
          </p>
        </section>
      </div>
      </div>
    </div>
  );
};
