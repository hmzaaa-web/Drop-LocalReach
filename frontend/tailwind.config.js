/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#4CAF50',
          'green-light': '#7ED957',
          'green-mint': '#B9F6CA',
          'green-hover': '#439e47',
          black: '#0B0B0B',
          white: '#FFFFFF',
          'neutral-50': '#F7F7F5',
          'neutral-100': '#EEEEEB',
          'neutral-200': '#DADAD6',
          'neutral-500': '#8A8A84',
          'neutral-800': '#42423E',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(11, 11, 11, 0.04)',
        'glass-hover': '0 12px 40px 0 rgba(11, 11, 11, 0.07)',
        'glass-active': '0 4px 20px 0 rgba(76, 175, 80, 0.12)',
      },
      borderRadius: {
        brand: '12px',
        card: '16px',
        input: '8px',
      },
      maxWidth: {
        site: '1440px',
      },
    },
  },
  plugins: [],
};
