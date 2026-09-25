import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminLogin } from '../../services/api';
import dropLogo from '../../assets/logo.png';

interface AdminLoginProps {
  onSuccess: () => void;
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onNotify }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the admin password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await adminLogin(password);
      onNotify?.('Authenticated successfully', 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please check credentials.';
      setErrorMessage(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-neutral-500 hover:text-brand-black transition-colors"
          >
            <ArrowLeft size={16} />
            Back to DROP
          </Link>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 border border-brand-neutral-200/80 shadow-xl bg-brand-white/80 backdrop-blur-xl">
          {/* Brand & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-neutral-100 border border-brand-neutral-200/60 mb-4 shadow-xs">
              <img src={dropLogo} alt="DROP" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-black">Admin Portal</h1>
            <p className="text-xs text-brand-neutral-500 mt-1 tracking-wide">
              Production Infrastructure & Resource Monitor
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-sm flex items-start gap-2.5">
              <span className="font-semibold text-rose-800">Error:</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-brand-neutral-800 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-neutral-400">
                  <Lock size={18} />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  autoFocus
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-brand-neutral-200 bg-brand-neutral-50/70 text-brand-black placeholder-brand-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-neutral-400 hover:text-brand-black transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-black text-brand-white font-semibold text-sm tracking-wide hover:bg-brand-neutral-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-brand-green-mint" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} className="text-brand-green-mint" />
                  Authenticate Admin
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-5 border-t border-brand-neutral-200/60 text-center">
            <p className="text-[11px] text-brand-neutral-400 leading-relaxed">
              Protected by rate-limiting & signed HttpOnly sessions.
              <br />
              All access attempts are cryptographically validated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
