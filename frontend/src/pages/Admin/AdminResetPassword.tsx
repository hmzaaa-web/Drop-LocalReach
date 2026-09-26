import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { verifyPasswordResetToken, confirmPasswordReset } from '../../services/api';
import { SEO } from '../../components/SEO';
import dropLogo from '../../assets/logo.png';

interface AdminResetPasswordProps {
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminResetPassword: React.FC<AdminResetPasswordProps> = ({ onNotify }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token.trim()) {
      setIsVerifying(false);
      setTokenValid(false);
      setTokenError('No password reset token was provided in the link.');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await verifyPasswordResetToken(token);
        if (res.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(res.message || 'This reset link has expired or has already been used.');
        }
      } catch {
        setTokenValid(false);
        setTokenError('Failed to verify the password reset link. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await confirmPasswordReset(token, newPassword);
      setIsSuccess(true);
      onNotify?.(res.message || 'Admin password updated successfully', 'success');
    } catch (err: any) {
      const msg = err.message || 'Failed to reset password. The link may have expired.';
      setFormError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Reset Admin Password — DROP by LocalReach"
        description="Reset your DROP administrator password."
        canonical="https://drop.localreach.in/admin/reset-password"
        robots="noindex, nofollow"
      />

      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back to Login */}
          <div className="mb-6">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-neutral-500 hover:text-brand-black transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Admin Login
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-brand-neutral-200/80 shadow-xl bg-brand-white/80 backdrop-blur-xl">
            {/* Brand Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-neutral-100 border border-brand-neutral-200/60 mb-4 shadow-xs">
                <img src={dropLogo} alt="DROP" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-brand-black">Reset Admin Password</h1>
              <p className="text-xs text-brand-neutral-500 mt-1">
                Enter your new administrator password below
              </p>
            </div>

            {/* State 1: Verifying Token */}
            {isVerifying && (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 size={28} className="animate-spin text-brand-green" />
                <span className="text-xs font-medium text-brand-neutral-500">
                  Verifying reset link security...
                </span>
              </div>
            )}

            {/* State 2: Invalid or Expired Token */}
            {!isVerifying && !tokenValid && !isSuccess && (
              <div className="space-y-6 text-center">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-sm flex items-start gap-3 text-left">
                  <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-semibold text-rose-800">Invalid or Expired Link</h2>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      {tokenError || 'This password reset link is invalid or has expired (links are valid for 15 minutes).'}
                    </p>
                  </div>
                </div>

                <Link
                  to="/admin"
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl bg-brand-black text-brand-white font-semibold text-sm hover:bg-brand-neutral-800 transition-colors"
                >
                  Return to Admin Login
                </Link>
              </div>
            )}

            {/* State 3: Password Reset Success */}
            {isSuccess && (
              <div className="space-y-6 text-center">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm flex items-start gap-3 text-left">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-semibold text-emerald-900">Password Updated Successfully</h2>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      Your new admin password is now active. You can sign in immediately.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="w-full py-3.5 px-4 rounded-xl bg-brand-black text-brand-white font-semibold text-sm hover:bg-brand-neutral-800 transition-colors shadow-xs"
                >
                  Proceed to Admin Login
                </button>
              </div>
            )}

            {/* State 4: Valid Token — Reset Form */}
            {!isVerifying && tokenValid && !isSuccess && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs">
                    {formError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="new-admin-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-brand-neutral-800 mb-2"
                  >
                    New Admin Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-neutral-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="new-admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      disabled={isSubmitting}
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

                <div>
                  <label
                    htmlFor="confirm-admin-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-brand-neutral-800 mb-2"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-neutral-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="confirm-admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      minLength={8}
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-brand-neutral-200 bg-brand-neutral-50/70 text-brand-black placeholder-brand-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword.trim() || !confirmPassword.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-brand-black text-brand-white font-semibold text-sm tracking-wide hover:bg-brand-neutral-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-brand-green-mint" />
                      Updating Password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
