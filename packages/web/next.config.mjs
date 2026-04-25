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
        '@react-native-async-storage/async-storage': false,
      };
    }
    return config;
  },
};

export default nextConfig;
