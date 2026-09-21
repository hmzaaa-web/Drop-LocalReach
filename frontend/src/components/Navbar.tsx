import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import dropLogo from '../assets/logo.png';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Close menu automatically on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <header className="glass-nav sticky top-0 z-50 backdrop-blur-md">
      <div className="site-container h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src={dropLogo}
            alt="DROP by LocalReach"
            className="w-7 h-7 object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-brand-black transition-colors group-hover:text-brand-green">
              DROP
            </span>
            <span className="text-xs font-medium text-brand-neutral-500 tracking-wide">
              by LocalReach
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              isActive('/')
                ? 'text-brand-black font-semibold'
                : 'text-brand-neutral-500 hover:text-brand-black'
            }`}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`text-sm font-medium transition-colors ${
              isActive('/about')
                ? 'text-brand-black font-semibold'
                : 'text-brand-neutral-500 hover:text-brand-black'
            }`}
          >
            About
          </Link>
          <Link
            to="/how-it-works"
            className={`text-sm font-medium transition-colors ${
              isActive('/how-it-works')
                ? 'text-brand-black font-semibold'
                : 'text-brand-neutral-500 hover:text-brand-black'
            }`}
          >
            How It Works
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          className="md:hidden p-2 -mr-2 rounded-brand text-brand-neutral-800 hover:text-brand-black hover:bg-brand-neutral-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green/30"
        >
          {isOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown Panel */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-brand-black/25 backdrop-blur-xs z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="border-b border-brand-neutral-200/80 bg-brand-neutral-50/95 backdrop-blur-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="site-container py-4 flex flex-col gap-1.5" aria-label="Mobile Navigation">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded-brand text-base font-medium transition-colors ${
                  isActive('/')
                    ? 'text-brand-black font-semibold bg-brand-neutral-100'
                    : 'text-brand-neutral-600 hover:text-brand-black hover:bg-brand-neutral-100/60'
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded-brand text-base font-medium transition-colors ${
                  isActive('/about')
                    ? 'text-brand-black font-semibold bg-brand-neutral-100'
                    : 'text-brand-neutral-600 hover:text-brand-black hover:bg-brand-neutral-100/60'
                }`}
              >
                About
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded-brand text-base font-medium transition-colors ${
                  isActive('/how-it-works')
                    ? 'text-brand-black font-semibold bg-brand-neutral-100'
                    : 'text-brand-neutral-600 hover:text-brand-black hover:bg-brand-neutral-100/60'
                }`}
              >
                How It Works
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
