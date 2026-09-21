import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global Scroll Restoration Component
 * Automatically scrolls to the top of the page on every route change.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};
