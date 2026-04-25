import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
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
        text: {
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
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
};
export default config;
