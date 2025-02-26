import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    try {
        // Create a Supabase client configured to use cookies
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    set(_name: string, _value: string, _options: Record<string, unknown>) {
                        // This is used for setting cookies in the browser during SSR
                        // We don't need this in middleware as we're just reading cookies
                    },
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    remove(_name: string, _options: Record<string, unknown>) {
                        // Same as above, not needed in middleware
                    },
                },
            }
        )
        
        // Refresh session if expired - required for Server Components
        const { data: { session } } = await supabase.auth.getSession()

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
    } catch (_error: unknown) {
        console.error('Auth middleware error:', _error)
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
