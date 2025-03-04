import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/server-logger';
import { NextResponse } from 'next/server';
import { handleServerError } from '@/app/api/errors_handlers/server-errors';
import { NextApiRequest } from 'next';

type ResponseData = {
    valid?: boolean;
    user?: Record<string, unknown>;
    error?: string;
};

export async function GET(request: Request) {
    logger.info('Token validation attempt', { path: '/api/auth/validate' });
    console.log('Token validation attempt received');

    try {
        // Get token from request (cookies or Authorization header)
        const token = getTokenFromRequest(request);
        
        if (!token) {
            logger.warn('No token provided for validation');
            return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 401 });
        }

        // Create Supabase client
        const supabase = await createClient(token);
        
        // Set session manually using the token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
            console.error('Error getting user:', error);
            logger.warn('Error getting user from Supabase', { error: error.message });
            return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
        }
        
        if (!user) {
            logger.warn('Invalid token', { error: 'No user found' });
            return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
        }
        
        // Token is valid, return user data
        logger.info('Token validated successfully', { userId: user.id });
        return NextResponse.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.user_metadata?.role || 'Player',
                displayName: user.user_metadata?.displayName || user.email
            }
        });
    } catch (error) {
        console.error('Token validation error:', error);
        logger.error('Token validation error', error instanceof Error ? error : new Error(String(error)));
        return handleServerError(error);
    }
}

function getTokenFromRequest(req: Request): string | null {
    try {
        // Check if req is defined
        if (!req) {
            console.warn('Request is undefined');
            return null;
        }

        // Check for token in Authorization header
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7); // Remove 'Bearer ' prefix
        }
        
        // Check for token in cookies
        const cookieHeader = req.headers.get('cookie');
        if (cookieHeader) {
            const cookies = parseCookieString(cookieHeader);
            if (cookies['sb-access-token']) {
                return cookies['sb-access-token'];
            }
        }
        
        // No token found
        return null;
    } catch (error) {
        console.error('Error extracting token from request:', error);
        return null;
    }
}

function parseCookieString(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    if (cookieString) {
        cookieString.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                cookies[name] = value;
            }
        });
    }
    
    return cookies;
} 