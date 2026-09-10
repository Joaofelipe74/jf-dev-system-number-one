/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@react-three/drei'],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
