import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Get the origin making the request
    const origin = request.headers.get('origin') || ''
    
    // Define allowed origins
    const allowedOrigins = [
        'http://localhost:5173',  // Vite dev server
        'http://localhost:3000',  // Next.js dev server
        'http://localhost:4173',  // Vite preview
        process.env.FRONTEND_URL || '',
    ].filter(Boolean);
    
    // Check if the origin is allowed
    const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    // Create the response
    const response = NextResponse.next()
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', allowOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
}

export const config = {
    matcher: '/api/:path*',
}
