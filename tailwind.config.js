/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode colors (primary theme)
        dark: {
          primary: '#121212',        // Main background
          secondary: '#1E1E1E',      // Card backgrounds
          tertiary: '#2C2C2C',       // Input fields, borders
          quaternary: '#3A3A3A',     // Hover states
        },
        // Light mode colors
        light: {
          primary: '#FFFFFF',        // Main background
          secondary: '#F8F9FA',      // Card backgrounds
          tertiary: '#E9ECEF',       // Input fields, borders
          quaternary: '#DEE2E6',     // Hover states
        },
        // Accent colors (consistent across themes)
        accent: {
          green: '#00C853',          // Primary green
          'green-hover': '#00E676',  // Green hover state
          red: '#FF5252',            // Negative changes
          'red-hover': '#FF1744',    // Red hover state
        },
        // Text colors
        text: {
          primary: '#FFFFFF',        // Primary text (dark mode)
          secondary: '#A0A0A0',      // Secondary text (dark mode)
          'primary-light': '#1A1A1A', // Primary text (light mode)
          'secondary-light': '#6C757D', // Secondary text (light mode)
        },
        // Metallic/glossy elements
        metallic: {
          silver: '#C0C0C0',
          'silver-dark': '#A0A0A0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 200, 83, 0.3)',
        'glow-red': '0 0 20px rgba(255, 82, 82, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 200, 83, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 200, 83, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}