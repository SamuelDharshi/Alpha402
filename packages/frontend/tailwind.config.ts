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
        bg: {
          primary: '#080C14',
          secondary: '#0D1220',
          tertiary: '#111827',
        },
        blue: {
          dim: '#0A1A3D',
          muted: '#1E3A6E',
          base: '#1E6FFF',
          bright: '#3B82F6',
        },
        neon: {
          cyan: '#00F5FF',
          magenta: '#FF00FF',
          yellow: '#FFE500',
          green: '#00FF88',
        },
        ink: {
          primary: '#F0F4FF',
          secondary: '#8892A4',
          tertiary: '#4B5563',
          mono: '#7BBFFF',
        },
        status: {
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          pending: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
