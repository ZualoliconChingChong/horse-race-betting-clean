/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde4b9',
          200: '#fcd38c',
          300: '#fbc25f',
          400: '#fab53d',
          500: '#f9a825',
          600: '#f59323',
          700: '#ef7b1f',
          800: '#e9641b',
          900: '#df4014',
        },
        dark: {
          50: '#f5f5f6',
          100: '#e6e6e7',
          200: '#d0d0d2',
          300: '#aeaeb2',
          400: '#84848a',
          500: '#69696f',
          600: '#5a5a5e',
          700: '#4d4d50',
          800: '#434345',
          900: '#27272a',
          950: '#18181b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
