import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimizações para produção
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Configurações de build
  output: 'standalone',
  
  // Ignorar erros de lint durante build (temporário)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ignorar erros de TypeScript durante build (temporário)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
