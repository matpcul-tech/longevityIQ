import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#050608',
        gold: '#C8A84B',
        amber: '#D4722A',
        teal: '#1A8A7A',
        card: '#0C1018',
        edge: '#1C2530',
        mist: '#9CA3AF',
        bone: '#E8E4D9',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        ui: ['var(--font-ui)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: {
        gilt: '0 0 0 1px #1C2530, 0 20px 60px -20px rgba(200, 168, 75, 0.18)',
      },
    },
  },
  plugins: [],
}

export default config
