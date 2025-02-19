import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export type Role = 'ADMIN' | 'USER'

export async function checkRole(requiredRole?: Role) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
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

export async function withAuth(handler: Function, requiredRole?: Role) {
    const auth = await checkRole(requiredRole)
    
    if (!auth.authorized) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }

    return handler(auth.session)
}
