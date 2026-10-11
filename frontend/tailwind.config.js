/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core brand
        indigo: {
          DEFAULT: '#0B1E3D',
          50: '#EEF1F6',
          100: '#D6DCE9',
          200: '#AEB9D2',
          300: '#8697BB',
          400: '#5E74A3',
          500: '#3C5486',
          600: '#26396B',
          700: '#1C2B4A', // surface-on-dark
          800: '#13203A',
          900: '#0B1E3D', // primary
          950: '#060F20',
        },
        gold: {
          DEFAULT: '#F4A340',
          50: '#FEF6EB',
          100: '#FDE9CB',
          200: '#FAD199',
          300: '#F7B968',
          400: '#F4A340',
          500: '#E0872A',
          600: '#B76B20',
          700: '#8C511A',
        },
        ivory: '#FAF8F3',
        surface: '#FFFFFF',
        border: '#E7E1D4',
        muted: '#5B6B8C',
        success: '#1E8E5A',
        warning: '#B8860B',
        error: '#C0392B',
        info: '#2E6BA8',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // The horizon-line signature — a thin gradient rule, never a full
        // decorative background gradient.
        horizon: 'linear-gradient(90deg, transparent, #F4A340 15%, #F4A340 85%, transparent)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,30,61,0.06), 0 1px 3px rgba(11,30,61,0.08)',
        elevated: '0 4px 16px rgba(11,30,61,0.10)',
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
