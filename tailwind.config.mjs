/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: {
            light:       'rgb(var(--brand-teal-light) / <alpha-value>)',
            lightAccent: 'rgb(var(--brand-teal-lightAccent) / <alpha-value>)',
            dark:        'rgb(var(--brand-teal-dark) / <alpha-value>)',
          },
          pink: {
            DEFAULT: 'rgb(var(--brand-pink) / <alpha-value>)',
            light:   'rgb(var(--brand-pink-light) / <alpha-value>)',
          }
        }
      }
    },
  },
  plugins: [],
};
