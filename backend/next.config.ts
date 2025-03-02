import type { NextConfig } from "next";

// Define environment-specific configurations
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

// Content Security Policy configuration
const ContentSecurityPolicy = {
  // Production CSP is more restrictive
  production: `
    default-src 'self';
    script-src 'self';
    style-src 'self';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self' https://*.supabase.co;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim(),
  
  // Development CSP allows more sources for better DX
  development: `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self' https://*.supabase.co ws:;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim(),
};

// Configure headers based on environment
const securityHeaders = [
  // Basic security headers for all environments
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: isProd ? ContentSecurityPolicy.production : ContentSecurityPolicy.development,
  },
];

// Add production-only headers
if (isProd) {
  securityHeaders.push(
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    }
  );
}

// Define the Next.js configuration
const nextConfig: NextConfig = {
  // Production optimizations
  output: 'standalone', // Optimized for containerized deployments
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable compression
  reactStrictMode: true, // Enable React strict mode
  
  // Cache and performance optimizations
  staticPageGenerationTimeout: 120, // Increase timeout for static page generation (in seconds)
  
  // Configure image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60, // Cache optimized images for at least 60 seconds
  },
  
  // Configure build optimization
  experimental: {
    // Optimize packages
    optimizeCss: true,
    // Turbopack configuration
    turbo: {
      rules: {
        // Configure loaders using glob patterns
        // Example: "*.mdx": ["mdx-loader"]
      },
    },
  },
  
  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
    // Add cache control for static assets
    {
      source: '/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // Prevent caching for API routes
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
        },
      ],
    },
  ],
  
  // Configure redirects
  redirects: async () => [
    {
      source: '/health',
      destination: '/api/health',
      permanent: true,
    },
  ],
  
  // Environment-specific settings
  env: {
    APP_ENV: process.env.NODE_ENV || 'development',
    APP_VERSION: process.env.APP_VERSION || '0.1.0',
    BUILD_TIME: new Date().toISOString(),
  },
  

};

export default nextConfig;
