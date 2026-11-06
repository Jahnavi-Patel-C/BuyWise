/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF9F6',
        surface: '#FFFFFF',
        surfaceMuted: '#F4F3F0',
        charcoal: {
          900: '#1A1C1E',
          800: '#2A2D34',
          700: '#3F444E',
          600: '#5A606D',
          500: '#757D8E',
          400: '#98A1B3',
          200: '#E4E7EC',
          100: '#F2F4F7',
          50: '#F8F9FA'
        },
        lavender: {
          50: '#F6F5FB',
          100: '#ECE9F7',
          200: '#DCD6F0',
          300: '#C4BAE5',
          500: '#8572B9',
          600: '#705BA6',
          700: '#5C498C'
        },
        sage: {
          50: '#F2F6F4',
          100: '#E2ECE6',
          200: '#C7DAD0',
          300: '#A4C3B2',
          500: '#5E8B75',
          600: '#4D7462',
          700: '#3D5C4E'
        },
        decision: {
          buy: '#10B981',
          buyBg: '#ECFDF5',
          buyBorder: '#A7F3D0',
          wait: '#F59E0B',
          waitBg: '#FFFBEB',
          waitBorder: '#FDE68A',
          reconsider: '#EF4444',
          reconsiderBg: '#FEF2F2',
          reconsiderBorder: '#FECACA'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(27, 38, 59, 0.05), 0 2px 6px -1px rgba(27, 38, 59, 0.03)',
        'elevated': '0 12px 32px -4px rgba(27, 38, 59, 0.08), 0 4px 12px -2px rgba(27, 38, 59, 0.04)',
      }
    },
  },
  plugins: [],
};

