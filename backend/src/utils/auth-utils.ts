import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Export Session type from Supabase
import type { Session } from '@supabase/supabase-js'
export { Session }

// Import Role from types
import { Role } from '../app/api/types/types'

export type AuthResult = 
  | { authorized: true; session: Session }
  | { authorized: false; error: string; status: number }

export async function checkRole(requiredRole?: Role): Promise<AuthResult> {
    try {
        // DEVELOPMENT MODE ONLY - DO NOT USE IN PRODUCTION
        // This is a simplified authentication system for testing purposes
        
        const cookieStore = await cookies()
        const authCookie = cookieStore.get('auth_token')
        
        // For development, we'll accept any auth token
        if (!authCookie?.value) {
            return {
                authorized: false,
                error: 'Unauthorized - Please login',
                status: 401
            }
        }
        
        try {
            // In development mode, we'll extract the user ID from the token
            // Format of the mock token is: mock_token_USER_ID_TIMESTAMP
            const tokenParts = authCookie.value.split('_');
            let userId = 'dev-user-id';
            
            // If the token follows our expected format, extract the user ID
            if (tokenParts.length >= 3 && tokenParts[0] === 'mock' && tokenParts[1] === 'token') {
                userId = tokenParts[2];
            }
            
            // Create a mock user with the required role or default to Manager
            const mockRole = requiredRole || 'Manager';
            
            // Create a mock session
            const mockSession: Session = {
                user: {
                    id: userId,
                    email: 'dev@example.com',
                    role: mockRole,
                    user_metadata: {
                        role: mockRole,
                        displayName: 'Development User'
                    }
                } as any,
                access_token: authCookie.value,
                refresh_token: 'mock-refresh-token',
                expires_at: Date.now() + 3600,
                expires_in: 3600,
                token_type: 'bearer'
            }
            
            // If a role is required, check that it matches
            if (requiredRole && mockRole !== requiredRole) {
                return {
                    authorized: false,
                    error: `Forbidden - ${requiredRole} access required`,
                    status: 403
                }
            }
            
            return {
                authorized: true,
                session: mockSession
            }
        } catch (error) {
            console.error('Auth error:', error)
            return {
                authorized: false,
                error: 'Invalid token',
                status: 401
            }
        }
    } catch (error) {
        console.error('Auth error:', error)
        return {
            authorized: false,
            error: 'Invalid token',
            status: 401
        }
    }
}

export async function withAuth<T>(
    request: Request | null,
    handler: (session: { 
        userId: string, 
        userEmail: string, 
        userRole: string, 
        userMetadata: any 
    }) => Promise<T>,
    requiredRole?: Role
): Promise<T | NextResponse> {
    const authResult = await checkRole(requiredRole);

    if (!authResult.authorized) {
        if ('error' in authResult && 'status' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        } else {
            throw new Error('Auth result is missing error and status properties');
        }
    }

    // Extract user information from the session
    const session = {
        userId: authResult.session.user.id,
        userEmail: authResult.session.user.email || '',
        userRole: authResult.session.user.role as string,
        userMetadata: authResult.session.user.user_metadata
    };

    return handler(session);
}
