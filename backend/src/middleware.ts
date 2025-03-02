// Next.js middleware

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { logger } from '@/utils/logger';

// In-memory store for rate limiting
// Note: For production, use Redis or another distributed cache
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // Maximum requests per window
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10); // Default: 1 minute window

// Suspicious request patterns to monitor
const SUSPICIOUS_PATTERNS = [
  /\.\.\//i,                    // Directory traversal
  /\{\{.*\}\}/i,               // Template injection
  /<script>[\s\S]*?<\/script>/i, // XSS attempts
  /(?:union|select|insert|update|delete|drop)\s+/i, // SQL injection
];

/**
 * Main middleware function that processes all requests
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const url = request.nextUrl.pathname;
  
  // Add request ID to headers for tracking
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  
  // Log incoming request in production (but not health checks to avoid log spam)
  if (process.env.NODE_ENV === 'production' && !url.includes('/api/health')) {
    logger.info({
      message: 'Incoming request',
      method: request.method,
      url,
      requestId,
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
  }
  
  try {
    // Check for suspicious patterns in request
    if (detectSuspiciousPatterns(request)) {
      logger.warn({
        message: 'Suspicious request pattern detected',
        requestId,
        url,
        ip: request.ip || 'unknown'
      });
      return NextResponse.json(
        { error: 'Bad request' },
        { status: 400 }
      );
    }
    
    // Apply rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const response = await applyRateLimit(request);
      if (response) return response;
    }

    // Apply CORS headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // For OPTIONS requests (preflight), return immediately with CORS headers
      if (request.method === 'OPTIONS') {
        const origin = getAllowedOrigin(request);
        console.log('CORS preflight request from origin:', origin);
        
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Request-ID, Cookie',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400', // 24 hours
            'Vary': 'Origin',
          },
        });
      }
      
      // For regular API requests, continue but we'll add CORS headers to the response
    }
    
    // Apply security headers to all responses
    const response = await updateSession(request);
    
    // Add security headers
    const responseHeaders = new Headers(response.headers);
    addSecurityHeaders(responseHeaders);
    
    // Add timing headers in development mode
    if (process.env.NODE_ENV !== 'production') {
      const endTime = Date.now();
      responseHeaders.set('Server-Timing', `total;dur=${endTime - startTime}`);
    }
    
    // Add request ID to response for tracking
    responseHeaders.set('x-request-id', requestId);
    
    // Add CORS headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const origin = getAllowedOrigin(request);
      console.log('Adding CORS headers for origin:', origin);
      
      responseHeaders.set('Access-Control-Allow-Origin', origin);
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Request-ID, Cookie');
      responseHeaders.set('Vary', 'Origin');
    }
    
    // Return the modified response
    return NextResponse.json(
      response.json ? await response.json() : undefined,
      {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    logger.error({
      message: 'Middleware error',
      error: error instanceof Error ? error.message : String(error),
      requestId,
      url
    });
    
    // Return a generic error to avoid leaking information
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Apply rate limiting to requests
 */
function applyRateLimit(request: NextRequest): NextResponse | null {
  // Get client IP
  const ip = request.ip || 'unknown';
  
  // Skip rate limiting for health checks
  if (request.nextUrl.pathname === '/api/health') {
    return null;
  }
  
  // Skip rate limiting for certain paths if needed
  const bypassPaths = ['/api/webhook'];
  if (bypassPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return null;
  }

  const now = Date.now();
  const ipData = ipRequestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  // Reset counter if the window has passed
  if (now > ipData.resetTime) {
    ipData.count = 0;
    ipData.resetTime = now + RATE_LIMIT_WINDOW_MS;
  }

  // Increment request count
  ipData.count++;
  ipRequestCounts.set(ip, ipData);
  
  // Calculate remaining requests
  const remaining = Math.max(0, RATE_LIMIT_MAX - ipData.count);

  // Check if rate limit exceeded
  if (ipData.count > RATE_LIMIT_MAX) {
    // Log rate limit exceeded in production
    if (process.env.NODE_ENV === 'production') {
      logger.warn({
        message: 'Rate limit exceeded',
        ip,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    }
    
    return NextResponse.json(
      { error: 'Too many requests', code: 'rate_limit_exceeded' },
      { 
        status: 429,
        headers: {
          'Retry-After': `${Math.ceil((ipData.resetTime - now) / 1000)}`,
          'X-RateLimit-Limit': `${RATE_LIMIT_MAX}`,
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': `${Math.ceil(ipData.resetTime / 1000)}`
        }
      }
    );
  }
  
  // Add rate limit headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', `${RATE_LIMIT_MAX}`);
  response.headers.set('X-RateLimit-Remaining', `${remaining}`);
  response.headers.set('X-RateLimit-Reset', `${Math.ceil(ipData.resetTime / 1000)}`);

  return null;
}

// This function is no longer used as we've moved the CORS handling directly into the middleware function

/**
 * Get the allowed origin based on the environment
 */
function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin') || '';
  
  // Parse allowed origins from environment variable if available
  let allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'http://localhost:8080', // Another common dev server port
    'http://127.0.0.1:5173', // Vite dev server with IP
    'http://127.0.0.1:8080', // Another common dev server port with IP
  ];
  
  // Add frontend URL from environment if available
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  
  // Add additional allowed origins from environment if available
  if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
    try {
      const additionalOrigins = JSON.parse(process.env.ADDITIONAL_ALLOWED_ORIGINS);
      if (Array.isArray(additionalOrigins)) {
        allowedOrigins = [...allowedOrigins, ...additionalOrigins];
      }
    } catch (error) {
      logger.error({
        message: 'Failed to parse ADDITIONAL_ALLOWED_ORIGINS',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Filter out empty values
  allowedOrigins = allowedOrigins.filter(Boolean);

  // In production, only allow specific origins
  if (process.env.NODE_ENV === 'production') {
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  }

  // In development, allow any origin
  return origin || '*';
}

/**
 * Add security headers to the response
 */
function addSecurityHeaders(headers: Headers): void {
  // Content Security Policy
  const cspValue = process.env.NODE_ENV === 'production'
    ? "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://*.supabase.co ws:; frame-ancestors 'none';"
  
  headers.set('Content-Security-Policy', cspValue);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only in production
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    
    // Add Permissions-Policy to limit features
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );
  }
}

/**
 * Detect suspicious patterns in the request
 */
function detectSuspiciousPatterns(request: NextRequest): boolean {
  const url = request.nextUrl.toString();
  const body = request.body ? String(request.body) : '';
  const headers = Object.fromEntries(request.headers.entries());
  
  // Combine all request data for inspection
  const requestData = `${url}|${body}|${JSON.stringify(headers)}`;
  
  // Check against suspicious patterns
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(requestData));
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to auth-related pages, but exclude static assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
