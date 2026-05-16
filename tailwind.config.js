/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        surface2: '#1a1a24',
        border: '#2a2a3a',
        accent: '#c8a96e',
        accent2: '#4ecdc4',
        danger: '#e05c5c',
        muted: '#888899',
        green: '#5dbb7a',
      },
      fontFamily: {
        serif: ['var(--font-noto-serif)', 'serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
}
