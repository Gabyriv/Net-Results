import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
    try {
        // Create a Supabase client configured to use cookies
        const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })
        
        // Refresh session if expired - required for Server Components
        const { data: { session }, error } = await supabase.auth.getSession()

        // If there's no session and the path is protected, redirect to login
        const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')
        const isDocsRoute = request.nextUrl.pathname.startsWith('/api/docs')
        
        if (!session && !isAuthRoute && !isDocsRoute) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            )
        }

        // For protected routes that require specific roles
        if (session) {
            const { data: { user } } = await supabase.auth.getUser()
            const userRole = user?.user_metadata?.role || 'USER'

            // Admin-only routes
            const isAdminRoute = request.nextUrl.pathname.startsWith('/api/admin')
            if (isAdminRoute && userRole !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'Forbidden - Admin access required' },
                    { status: 403 }
                )
            }
        }

        // Continue with the request
        return NextResponse.next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        // Apply to all API routes except auth and docs
        '/api/:path*',
        // Exclude auth routes
        '/((?!api/auth|api/docs).*)',
    ],
}
