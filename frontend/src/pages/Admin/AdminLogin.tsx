import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, Mail, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminLogin, requestPasswordReset } from '../../services/api';
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

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

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

  const handleRequestReset = async () => {
    setIsSendingReset(true);
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    try {
      const res = await requestPasswordReset();
      setResetSuccessMessage(res.message || 'If a password reset request was submitted, a reset email will be sent.');
      onNotify?.('Password reset email dispatched', 'info');
    } catch (err: any) {
      const msg = err.message || 'Failed to request reset. Please try again later.';
      setResetErrorMessage(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsSendingReset(false);
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

              {/* Forgot Password Trigger Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setResetSuccessMessage(null);
                    setResetErrorMessage(null);
                  }}
                  className="text-xs font-medium text-brand-neutral-500 hover:text-brand-black hover:underline transition-colors focus:outline-none"
                >
                  Forgot Password?
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/40 backdrop-blur-xs animate-fade-in">
          <div className="glass-card bg-brand-white rounded-2xl max-w-md w-full p-6 border border-brand-neutral-200 shadow-2xl relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-brand-neutral-400 hover:text-brand-black hover:bg-brand-neutral-100 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-neutral-100 text-brand-neutral-700 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-black">Admin Password Recovery</h3>
                <p className="text-xs text-brand-neutral-500">Secure single-use reset link</p>
              </div>
            </div>

            {resetSuccessMessage ? (
              <div className="space-y-5 my-3">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-semibold">{resetSuccessMessage}</p>
                    <p className="mt-1 text-emerald-700">
                      Check your inbox at <strong>mdhamza0612@gmail.com</strong>. The link expires in 15 minutes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 rounded-xl bg-brand-black text-brand-white text-xs font-semibold hover:bg-brand-neutral-800 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4 my-2">
                <p className="text-xs text-brand-neutral-600 leading-relaxed">
                  For security, the recovery link is dispatched strictly to the verified administrator email on file:
                </p>
                <div className="p-3 rounded-xl bg-brand-neutral-50 border border-brand-neutral-200/80 font-mono text-xs text-brand-neutral-700 text-center select-all">
                  mdhamza0612@gmail.com
                </div>
                <p className="text-[11px] text-brand-neutral-400">
                  Rate-limited to 3 requests per hour. The link expires after 15 minutes and can only be used once.
                </p>

                {resetErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {resetErrorMessage}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-brand-neutral-200 text-brand-neutral-700 text-xs font-semibold hover:bg-brand-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestReset}
                    disabled={isSendingReset}
                    className="flex-1 py-2.5 rounded-xl bg-brand-black text-brand-white text-xs font-semibold hover:bg-brand-neutral-800 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-brand-green-mint" />
                        Sending...
                      </>
                    ) : (
                      'Send Recovery Link'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
