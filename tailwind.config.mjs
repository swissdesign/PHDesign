/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: {
            light: '#A1E4ED', // Light mode background
            lightAccent: '#E0F7FA', // Used for text in dark mode
            dark: '#0A191E', // Dark mode background & light mode text
          },
          pink: {
            DEFAULT: '#C2185B', // Deep, professional pink (Light Mode use)
            light: '#F48FB1', // Highly visible pink (Dark mode use)
          }
        }
      }
    },
  },
  plugins: [],
};
