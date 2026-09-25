import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { checkAdminSession } from '../../services/api';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { SEO } from '../../components/SEO';

interface AdminProps {
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const Admin: React.FC<AdminProps> = ({ onNotify }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkSession = async () => {
    try {
      const res = await checkAdminSession();
      setIsAuthenticated(res.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Suppress public analytics tracking on /admin if any tracker exists in window
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).va) {
      try {
        (window as any).va('beforeSend', (event: any) => {
          if (event?.url && event.url.includes('/admin')) return null;
          return event;
        });
      } catch {}
    }
  }, []);

  // Loading state while verifying HttpOnly session cookie
  if (isAuthenticated === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-brand-green" />
        <span className="text-xs font-medium text-brand-neutral-500">Checking admin session...</span>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Admin Portal — DROP by LocalReach"
        description="DROP by LocalReach administrative portal and system status."
        canonical="https://drop.localreach.in/admin"
        robots="noindex, nofollow"
      />


      {isAuthenticated ? (
        <AdminDashboard
          onLogout={() => setIsAuthenticated(false)}
          onNotify={onNotify}
        />
      ) : (
        <AdminLogin
          onSuccess={() => setIsAuthenticated(true)}
          onNotify={onNotify}
        />
      )}
    </>
  );
};

export default Admin;
