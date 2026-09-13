import type { Config } from 'tailwindcss'

/**
 * Tailwind is used by the admin dashboard only (src/admin). The public site
 * keeps the original design CSS. Colors are the Familist design tokens.
 */
export default {
  content: ['./src/admin/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1a1a2e', deep: '#0d0d18' },
        gold: { DEFAULT: '#c9a227', bright: '#d4af37', light: '#e8d5a3' },
        ivory: '#fffef9',
        cream: '#faf8f4',
        stone: '#e7e1d3',
        ink: '#1a1a2e',
        muted: '#4a4a5e',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        btn: '2px',
      },
    },
  },
} satisfies Config
