import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 rounded-[8px] gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-[10px] gap-2',
    lg: 'text-base px-6 py-3 rounded-[12px] gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-brand-green text-white hover:bg-brand-green-hover focus:ring-brand-green/40 shadow-sm active:scale-[0.99]',
    secondary:
      'bg-white/80 hover:bg-white text-brand-black border border-brand-neutral-200 hover:border-brand-neutral-500/40 focus:ring-brand-neutral-500/20 backdrop-blur-sm',
    ghost:
      'bg-transparent hover:bg-brand-neutral-100 text-brand-neutral-800 hover:text-brand-black focus:ring-brand-neutral-500/20',
    danger:
      'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 focus:ring-red-500/20',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 mr-1 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};
