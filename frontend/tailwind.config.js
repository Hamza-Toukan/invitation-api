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
        teal: {
          DEFAULT: '#12363A',
          deep: '#0B2225',
          light: '#1B4E54',
        },
        ivory: {
          DEFAULT: '#F6F0E6',
          pale: '#FCFAF6',
          dark: '#EBE2D3',
        },
        brass: {
          DEFAULT: '#B88A4A',
          light: '#D4A86A',
          dark: '#936C35',
        },
        clay: {
          DEFAULT: '#C97B6B',
          light: '#DC9B8E',
          dark: '#A65D4F',
        },
        ink: {
          DEFAULT: '#1C1F24',
          muted: '#4A5059',
          faint: '#7A828E',
        },
        'sand-card': '#FFFFFF',
        'sand-border': '#D9CFBD',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Fraunces', 'Reem Kufi', 'serif'],
        body: ['var(--font-body)', 'DM Sans', 'IBM Plex Sans Arabic', 'sans-serif'],
        'fraunces': ['Fraunces', 'serif'],
        'reem-kufi': ['"Reem Kufi"', 'sans-serif'],
        'dm-sans': ['"DM Sans"', 'sans-serif'],
        'ibm-plex-arabic': ['"IBM Plex Sans Arabic"', 'sans-serif'],
        'ruqaa': ['"Aref Ruqaa"', 'serif'],
      },
      borderRadius: {
        'pill': '9999px',
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(18, 54, 58, 0.06)',
        'elevated': '0 12px 32px -4px rgba(18, 54, 58, 0.12)',
        'brass-glow': '0 0 24px rgba(184, 138, 74, 0.25)',
      },
    },
  },
  plugins: [],
};
