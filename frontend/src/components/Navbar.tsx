import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import dropLogo from '../assets/logo.png';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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

        {/* Minimal Navigation */}
        <nav className="flex items-center gap-8">
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
      </div>
    </header>
  );
};
