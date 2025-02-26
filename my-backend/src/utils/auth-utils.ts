import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Export Session type from Supabase
import type { Session } from '@supabase/supabase-js'
export { Session }

export type Role = 'ADMIN' | 'USER'

export type AuthResult = 
  | { authorized: true; session: Session }
  | { authorized: false; error: string; status: number }

export async function checkRole(requiredRole?: Role): Promise<AuthResult> {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: Record<string, unknown>) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: Record<string, unknown>) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
            return {
                authorized: false,
                error: 'Unauthorized - Please login',
                status: 401
            }
        }

        if (requiredRole) {
            const userRole = session.user.user_metadata?.role || 'USER'
            if (requiredRole === 'ADMIN' && userRole !== 'ADMIN') {
                return {
                    authorized: false,
                    error: 'Forbidden - Admin access required',
                    status: 403
                }
            }
        }

        return {
            authorized: true,
            session
        }
    } catch (error) {
        console.error('Authorization check error:', error)
        return {
            authorized: false,
            error: 'Internal Server Error',
            status: 500
        }
    }
}

export async function withAuth(
    handler: (session: Session) => Promise<Response | NextResponse>, 
    requiredRole?: Role
) {
    const auth = await checkRole(requiredRole)
    
    if (!auth.authorized) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }

    if (!auth.session) {
        return NextResponse.json(
            { error: 'Session not found' },
            { status: 401 }
        )
    }

    return handler(auth.session)
}
