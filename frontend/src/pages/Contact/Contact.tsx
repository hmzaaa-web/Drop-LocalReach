import React, { useState } from 'react';
import { Send, Info } from 'lucide-react';
import { Button } from '../../components/Button';
import { BackButton } from '../../components/BackButton';
import { SEO } from '../../components/SEO';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Configurable contact email from environment
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'support@localreach.in';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    // Safe fallback via mailto since backend does not currently have an email-dispatch service
    const subject = encodeURIComponent(`DROP Support Request from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n---\nSent via DROP Contact Interface`
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="flex-1 site-container py-10 md:py-16 w-full animate-fade-in">
      <SEO
        title="DROP by LocalReach — Contact"
        description="Contact the LocalReach team for inquiries, support or security questions regarding DROP temporary file sharing."
        canonical="https://drop.localreach.in/contact"
      />
      <div className="mb-6">
        <BackButton fallbackUrl="/" />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-green mb-3 block">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-black mb-3">
          CONTACT DROP
        </h1>
        <p className="text-sm md:text-base text-brand-neutral-800 max-w-md mx-auto leading-relaxed">
          Have a problem, found something broken or need help?
        </p>
      </div>

      {/* Contact Form Container */}
      <div className="glass-card rounded-card p-6 md:p-10 border border-brand-neutral-200/80 bg-white/80 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="text-xs font-semibold text-brand-black block mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full text-sm px-3.5 py-2.5 rounded-input border border-brand-neutral-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-colors bg-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-semibold text-brand-black block mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-sm px-3.5 py-2.5 rounded-input border border-brand-neutral-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-colors bg-white"
            />
          </div>

          <div>
            <label htmlFor="message" className="text-xs font-semibold text-brand-black block mb-2">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what happened or how we can help..."
              className="w-full text-sm px-3.5 py-2.5 rounded-input border border-brand-neutral-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-colors bg-white resize-none"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" className="w-full justify-center">
              <Send size={15} />
              Send Message
            </Button>
          </div>
        </form>

        {submitted && (
          <div className="rounded-brand bg-brand-neutral-100 p-4 border border-brand-neutral-200 text-xs text-brand-neutral-800 space-y-1">
            <div className="font-semibold text-brand-black flex items-center gap-1.5">
              <Info size={14} className="text-brand-green" />
              Opening your default mail client
            </div>
            <p className="text-brand-neutral-500">
              Your message draft has been prepared for <span className="font-mono text-brand-black">{contactEmail}</span>. If your email application did not launch automatically, you can send your message directly to that address.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
