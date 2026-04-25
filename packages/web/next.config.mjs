import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'three', 
    '@react-three/fiber', 
    '@react-three/drei', 
    '@react-three/postprocessing',
    'framer-motion',
    'framer-motion-3d'
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        'three': path.resolve(__dirname, '../../node_modules/three'),
        '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/lib/async-storage-polyfill.js'),
      };
    }
    return config;
  },
};

export default nextConfig;
