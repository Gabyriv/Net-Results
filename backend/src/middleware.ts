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
    logger.info(
      `Incoming request: ${request.method} ${url} from ${request.headers.get('x-forwarded-for') || 'unknown'}`
    );
  }
  
  try {
    // Check for suspicious patterns in request
    if (detectSuspiciousPatterns(request)) {
      logger.warn(
        `Suspicious request pattern detected: ${url} from ${request.headers.get('x-forwarded-for') || 'unknown'}`
      );
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

    // For API routes, handle CORS properly
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const origin = getAllowedOrigin(request);
      
      // For OPTIONS requests (preflight), return immediately with CORS headers
      if (request.method === 'OPTIONS') {
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
      
      // For API routes, continue with the request
      // The response will be handled by the API route handler
      const response = await updateSession(request);
      
      // If it's a response from the updateSession (like a redirect or error),
      // add CORS headers to it and return
      if (response.status !== 200) {
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Credentials', 'true');
        headers.set('Vary', 'Origin');
        
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      }
      
      // Otherwise continue with the request to the API route
      // The NextResponse.next() will allow the request to proceed to the API route
      const modifiedRequest = {
        ...request,
        headers: requestHeaders
      };
      
      return NextResponse.next({
        request: modifiedRequest
      });
    }
    
    // For non-API routes, proceed with regular session handling
    const response = await updateSession(request);
    
    // Add security headers
    const responseHeaders = new Headers(response.headers);
    addSecurityHeaders(responseHeaders);
    
    // Add request ID to response for tracking
    responseHeaders.set('x-request-id', requestId);
    
    // Return the modified response
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
      headers: responseHeaders,
    });
  } catch (error) {
    logger.error(
      `Middleware error: ${error instanceof Error ? error.message : String(error)} for ${url}`
    );
    
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
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
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
      logger.warn(
        `Rate limit exceeded: ${request.nextUrl.pathname} from ${ip}`
      );
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
      logger.error(
        `Failed to parse ADDITIONAL_ALLOWED_ORIGINS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  // Filter out empty values
  allowedOrigins = allowedOrigins.filter(Boolean);
  
  // Check if the request origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  
  // If not in the allowed list, use the first allowed origin as fallback
  // This is safer than using '*' which allows any site to make requests
  return allowedOrigins[0] || 'http://localhost:5173';
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(headers: Headers): void {
  // Common security headers
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add Content-Security-Policy if not already set
  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co;");
  }
  
  // Add Permissions-Policy if not already set
  if (!headers.has('Permissions-Policy')) {
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }
}

/**
 * Detect suspicious patterns in the request
 */
function detectSuspiciousPatterns(request: NextRequest): boolean {
  const url = request.nextUrl.toString();
  const body = request.body ? 'yes' : 'no'; // We can't read the body here, just check if it exists
  
  // Check URL against suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      return true;
    }
  }
  
  // Additional checks could be added here
  
  return false;
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
