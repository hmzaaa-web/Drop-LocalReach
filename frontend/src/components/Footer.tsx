import React from 'react';
import { Link } from 'react-router-dom';
import dropLogo from '../assets/logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-brand-neutral-200/60 mt-auto py-12">
      <div className="site-container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Brand & Tagline */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <img src={dropLogo} alt="DROP by LocalReach" className="w-5 h-5 object-contain" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-brand-black tracking-tight">DROP</span>
              <span className="text-xs font-medium text-brand-neutral-500">by LocalReach</span>
            </div>
          </div>
          <p className="text-xs text-brand-neutral-500">
            Temporary file sharing, simply.
          </p>
        </div>

        {/* Minimal Navigation & Links */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-brand-neutral-500">
          <Link to="/" className="hover:text-brand-black transition-colors">
            Home
          </Link>
          <Link to="/about" className="hover:text-brand-black transition-colors">
            About
          </Link>
          <Link to="/how-it-works" className="hover:text-brand-black transition-colors">
            How It Works
          </Link>
          <Link to="/contact" className="hover:text-brand-black transition-colors">
            Contact
          </Link>
          <Link to="/privacy" className="hover:text-brand-black transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-brand-black transition-colors">
            Terms & Conditions
          </Link>
        </div>

        {/* Essential Rule & Copyright */}
        <div className="text-xs text-brand-neutral-500/80">
          © {new Date().getFullYear()} DROP by LocalReach.
        </div>
      </div>
    </footer>
  );
};
