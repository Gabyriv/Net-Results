// Auth utilities for the backend

import { NextResponse } from 'next/server'
import { NextApiRequest } from 'next'
import { parse } from 'cookie'

// Import types from Supabase
import type { Session, User } from '@supabase/supabase-js'
export { Session }

// Import Role from types
import { Role } from '../app/api/types/types'
import { createClient } from './supabase/server'

// Define our own session type that can be either a full Session or a User-only session
export type AuthSession = Session | {
  user: User;
  access_token: string;
  refresh_token: string | null;
  expires_in: number;
  token_type: string;
}

export type AuthResult = 
  | { authorized: true; session: AuthSession }
  | { authorized: false; error: string; status: number }

export async function checkRole(request: Request | NextApiRequest |null, requiredRole?: Role): Promise<AuthResult> {
    try {
        console.log('checkRole: Creating Supabase client')
        // Create Supabase server client
        const supabase = await createClient()
        console.log('checkRole: Supabase client created')
        
        // Get token from request cookies or Authorization header
        let token = null
        if (request) {
            // Try to get token from cookies
            const cookieHeader = request.headers.get('cookie')
            if (cookieHeader) {
                const cookies = parse(cookieHeader)
                token = cookies.auth_token
            }
            
            // If no token in cookies, try Authorization header
            if (!token) {
                const authHeader = request.headers.get('Authorization')
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7)
                }
            }
        }
        
        console.log('checkRole: Token found:', !!token)
        
        // Get the user's session
        console.log('checkRole: Getting session')
        let session = null
        let error = null
        
        if (token) {
            // If we have a token, use it to get the session
            const result = await supabase.auth.getUser(token)
            if (result.data?.user) {
                // Create a complete session object with the required properties
                session = {
                    user: result.data.user,
                    access_token: token,
                    refresh_token: null,
                    expires_in: 3600, // Default to 1 hour
                    token_type: 'bearer'
                }
            }
            error = result.error
        } else {
            // Otherwise try to get the session from Supabase
            const result = await supabase.auth.getSession()
            session = result.data.session
            error = result.error
        }
        
        console.log('checkRole: Session result:', !!session, 'Error:', !!error)
        
        if (error || !session) {
            return {
                authorized: false,
                error: 'Unauthorized - Please login',
                status: 401
            }
        }
        
        try {
            // Get user metadata including role
            const userRole = session.user.user_metadata?.role as Role || 'Player'
            
            // If a role is required, check that the user has the required role
            if (requiredRole && userRole !== requiredRole) {
                return {
                    authorized: false,
                    error: `Forbidden - ${requiredRole} access required`,
                    status: 403
                }
            }
            
            return {
                authorized: true,
                session
            }
        } catch (error) {
            console.error('Auth error:', error)
            return {
                authorized: false,
                error: 'Invalid session',
                status: 401
            }
        }
    } catch (error) {
        console.error('Auth error:', error)
        return {
            authorized: false,
            error: 'Authentication service unavailable',
            status: 500
        }
    }
}

/**
 * Higher-order function to protect API routes with authentication
 * @param request The request object
 * @param handler The handler function to execute if authenticated
 * @param requiredRole Optional role required for access
 */
export async function withAuth<T>(
    request: Request | NextApiRequest | null,
    handler: (session: { 
        userId: string, 
        userEmail: string, 
        userRole: string, 
        userMetadata: Record<string, unknown> 
    }) => Promise<T>,
    requiredRole?: Role
): Promise<T | NextResponse> {
    console.log('withAuth: Starting authentication check')
    
    // Check authentication and role
    console.log('withAuth: Calling checkRole with request')
    const authResult = await checkRole(request, requiredRole);
    console.log('withAuth: Auth result:', authResult.authorized ? 'Authorized' : 'Unauthorized')

    if (!authResult.authorized) {
        console.log('withAuth: Unauthorized, returning error response')
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    // Extract user data from the session
    const session = authResult.session;
    console.log('withAuth: User authenticated, extracting session data')
    
    const userId = session.user.id;
    const userEmail = session.user.email || '';
    const userRole = session.user.user_metadata?.role || 'User';
    const userMetadata = session.user.user_metadata || {};

    // Execute the handler with the session information
    try {
        console.log('withAuth: Executing handler')
        return await handler({
            userId,
            userEmail,
            userRole,
            userMetadata
        });
    } catch (error) {
        console.error('withAuth: Error in handler:', error);
        if (error instanceof Error) {
            console.error('withAuth: Error message:', error.message);
            console.error('withAuth: Error stack:', error.stack);
        }
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

/**
 * Get the token from the request
 * @param request The request object
 * @returns The token if found, null otherwise
 */
export function getTokenFromRequest(request: Request | NextApiRequest | null): string | null {
    if (!request) return null;
    
    let token: string | null = null;
    
    // Check if it's a NextApiRequest (Pages Router)
    if ('cookies' in request && typeof request.cookies === 'object') {
        // NextApiRequest from Pages Router
        token = request.cookies.auth_token || null;
        
        // Also check Authorization header
        const authHeader = request.headers.authorization;
        if (!token && authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    } else {
        // Regular Request from App Router
        // Get token from cookie
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
            const cookies = parse(cookieHeader);
            token = cookies.auth_token || null;
        }
        
        // If no token in cookie, try Authorization header
        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
    }
    
    return token;
}
