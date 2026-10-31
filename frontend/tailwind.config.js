/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Family album" look (design option B): leaf green, turmeric, terracotta
        album: {
          leaf: '#1E4636',
          // The page background; set in index.css so the look can change in one place.
          paper: 'rgb(var(--album-paper) / <alpha-value>)',
          line: '#DCE6D2',
          sage: '#BFD8B0',
          moss: '#5C8A4A',
          turmeric: '#F2B705',
          sun: '#F6D77A',
          terracotta: '#C4502F',
          peach: '#E8A58C',
          blush: '#F2C6B4',
        },
        heritage: {
          ivory: '#F8F4EC',
          cream: '#EFE4D2',
          sandalwood: '#E6D7C3',
          card: '#FFFEFB',
          border: '#E3D8C8',
          borderLight: '#ECE4D8',
          charcoal: '#292522',
          charcoalLight: '#47403B',
          muted: '#786C61',
          mutedLight: '#A3968B',
          maroon: {
            DEFAULT: '#702D3B',
            50: '#FBF4F5',
            100: '#F6E4E7',
            200: '#ECC8D0',
            300: '#DC9EB0',
            400: '#C76A85',
            500: '#AC3F60',
            600: '#8F314C',
            700: '#702D3B',
            800: '#54202B',
            900: '#3D151E',
            950: '#260B12',
          },
          gold: {
            DEFAULT: '#B6955B',
            50: '#FAF7EE',
            100: '#F4ECD8',
            200: '#E8D7B0',
            300: '#DCBF88',
            400: '#CAA569',
            500: '#B6955B',
            600: '#997641',
            700: '#7B5C31',
            800: '#644A29',
            900: '#533C24',
          },
          green: {
            DEFAULT: '#466847',
            light: '#658C66',
            dark: '#2E4B2F',
          },
          terracotta: {
            DEFAULT: '#A6533A',
            light: '#C76D52',
            dark: '#7D3925',
          }
        }
      },
      fontFamily: {
        album: ['"Baloo Thambi 2"', 'system-ui', 'sans-serif'],
        hand: ['"Kalam"', 'cursive'],
        serif: ['"Cinzel"', '"Noto Serif Tamil"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', '"Noto Serif Tamil"', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
        tamil: ['"Noto Serif Tamil"', '"Noto Sans Tamil"', 'serif'],
      },
      boxShadow: {
        'heritage-sm': '0 2px 6px -1px rgba(112, 45, 59, 0.06), 0 1px 3px -1px rgba(41, 37, 34, 0.04)',
        'heritage': '0 8px 24px -4px rgba(112, 45, 59, 0.08), 0 4px 12px -2px rgba(182, 149, 91, 0.06)',
        'heritage-lg': '0 16px 36px -6px rgba(112, 45, 59, 0.12), 0 8px 16px -4px rgba(182, 149, 91, 0.1)',
        'gold-glow': '0 0 25px rgba(182, 149, 91, 0.35)',
        'maroon-glow': '0 0 25px rgba(112, 45, 59, 0.35)',
      },
      backgroundImage: {
        'kolam-subtle': "radial-gradient(#B6955B 0.75px, transparent 0.75px), radial-gradient(#702D3B 0.75px, #F8F4EC 0.75px)",
      }
    },
  },
  plugins: [],
}
