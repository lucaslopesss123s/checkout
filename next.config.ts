import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimizações para produção
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Configurações de build
  output: 'standalone',
  
  // Configurações de CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
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
