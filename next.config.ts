import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**/*': ['./src/data/journals.json.gz', './src/data/summaries/manifest.json', './src/data/summaries/shards/*.json.gz'],
  },
  experimental: {
    cpus: 2,
    serverActions: {
      allowedOrigins: ['academic-journal-index.pages.dev'],
    },
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
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
