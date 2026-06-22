/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          DEFAULT: '#1a1a2e',
          light: '#2d2d44',
          dark: '#0f0f1a',
        },
        // Accent (vibrant teal)
        accent: {
          DEFAULT: '#00d4aa',
          hover: '#00b894',
          light: '#00f5c4',
          dark: '#009d7e',
        },
        // Neutrals
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#1a1a2e',
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
    },
  },
  plugins: [],
};
