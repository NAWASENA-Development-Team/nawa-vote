/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        // Custom Harmonious Color Palette
        brand: {
          navy: {
            50: "#f4f6fa",
            100: "#e9edf5",
            200: "#c7d4e7",
            300: "#96afd2",
            400: "#5d83b9",
            500: "#3d619b",
            600: "#2e4a7d",
            700: "#1e3a5f",  // Official Deep Navy Primary
            800: "#1b2c49",
            900: "#0f172a",  // Dark Slate / Text Dark
            950: "#0b0f19",
          },
          amber: {
            50: "#fffbeb",
            100: "#fef3c7",
            200: "#fde68a",
            300: "#fcd34d",
            400: "#fbbf24",
            500: "#f59e0b",  // Active Accent Gold
            600: "#d97706",
            700: "#b45309",
            800: "#92400e",
            900: "#78350f",
          },
          emerald: {
            50: "#ecfdf5",
            100: "#d1fae5",
            200: "#a7f3d0",
            300: "#6ee7b7",
            400: "#34d399",
            500: "#10b981",  // Success Emerald
            600: "#059669",
            700: "#047857",
            800: "#065f46",
            950: "#022c22",
          }
        },
      },
      boxShadow: {
        'glass-sm': '0 2px 8px 0 rgba(31, 38, 135, 0.04)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-lg': '0 12px 40px 0 rgba(31, 38, 135, 0.12)',
        'brand': '0 10px 30px -10px rgba(30, 58, 95, 0.3)',
        'brand-gold': '0 10px 30px -10px rgba(245, 158, 11, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-grad': 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%)',
        'glass-dark-grad': 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.5) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
