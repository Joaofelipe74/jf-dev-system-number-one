import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1180px',
        '2xl': '1320px',
      },
    },
    extend: {
      colors: {
        // JF Dev — identidade visual
        bg: {
          DEFAULT: '#06080D',
          secondary: '#0A0F18',
        },
        surface: {
          DEFAULT: '#0D1420',
          elevated: '#111B2A',
        },
        blue: {
          main: '#008CFF',
          electric: '#00A8FF',
          neon: '#00C2FF',
        },
        violet: {
          DEFAULT: '#6C5CE7',
          neon: '#8B5CF6',
        },
        ink: {
          DEFAULT: '#F8FAFC',
          muted: '#94A3B8',
        },
        'border-soft': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 40px rgba(0,168,255,0.25)',
        'glow-blue-sm': '0 0 18px rgba(0,168,255,0.20)',
        'glow-violet': '0 0 40px rgba(139,92,246,0.22)',
        card: '0 8px 30px rgba(0,0,0,0.35)',
        'card-hover': '0 16px 50px rgba(0,140,255,0.15)',
      },
      backgroundImage: {
        'grid-glow':
          'radial-gradient(circle at 20% 20%, rgba(0,168,255,0.10), transparent 45%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.10), transparent 40%), radial-gradient(circle at 50% 100%, rgba(0,194,255,0.08), transparent 45%)',
        'hero-radial':
          'radial-gradient(60% 60% at 70% 20%, rgba(0,168,255,0.18) 0%, rgba(6,8,13,0) 70%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
