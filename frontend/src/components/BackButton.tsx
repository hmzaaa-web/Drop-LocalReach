import React from 'react';
import { useNavigate } from 'react-router-dom';
import leftArrowSvg from '../assets/left-arrow.svg';

interface BackButtonProps {
  fallbackUrl?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ fallbackUrl = '/', className = '' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there is useful browser history
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Back"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-brand glass-subtle text-xs font-medium text-brand-black border border-brand-neutral-200/80 hover:border-brand-neutral-500/40 hover:bg-white/80 active:scale-[0.98] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${className}`}
    >
      <img
        src={leftArrowSvg}
        alt=""
        aria-hidden="true"
        className="w-3.5 h-3.5 object-contain transition-transform duration-200 group-hover:-translate-x-0.5"
      />
      <span>Back</span>
    </button>
  );
};
