/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Primary palette - Deep Navy
        primary: {
          DEFAULT: '#0a0e1a',
          light: '#141b2d',
          dark: '#050810',
        },
        // Accent (vibrant teal)
        accent: {
          DEFAULT: '#00d4aa',
          hover: '#00eabb',
          light: '#33ffd4',
          dark: '#009d7e',
        },
        // Secondary accent (purple)
        'accent-secondary': {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#6d28d9',
        },
        // Neutrals
        neutral: {
          50: '#f0f4f8',
          100: '#e2e8f0',
          200: '#c9d4e0',
          300: '#a8b8cc',
          400: '#8899a6',
          500: '#5a6d7e',
          600: '#3d4f5f',
          700: '#253046',
          800: '#1a2238',
          900: '#0d1220',
          950: '#0a0e1a',
        },
        // Semantic colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        // Privacy indicator
        privacy: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        'card-lg': '16px',
        button: '8px',
      },
      spacing: {
        header: '56px',
        sidebar: '240px',
        'sidebar-collapsed': '64px',
        footer: '40px',
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(0, 212, 170, 0.3), 0 0 60px rgba(0, 212, 170, 0.1)',
        'glow-accent-sm': '0 0 10px rgba(0, 212, 170, 0.2)',
        'glow-secondary': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-accent': 'linear-gradient(135deg, #00d4aa, #8b5cf6)',
        'gradient-dark': 'radial-gradient(ellipse at top, #141b2d 0%, #0a0e1a 50%, #050810 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
