import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/server-logger';
import { NextResponse } from 'next/server';
import { handleServerError } from '@/app/api/errors_handlers/server-errors';

type ResponseData = {
    success?: boolean;
    error?: string;
};

export async function POST(request: Request) {
    logger.info('Logout attempt', { path: '/api/auth/logout' });
    console.log('Logout attempt received');

    try {
        // Create Supabase client
        const supabase = await createClient(null);
        
        // Sign out the user
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            logger.warn('Logout failed', { error: error.message });
            return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
        }

        // Create response
        const response = NextResponse.json({ success: true }, { status: 200 });
        
        // Clear all auth-related cookies
        const cookiesToClear = [
            'auth_token',
            'sb-access-token',
            'sb-refresh-token'
        ];

        cookiesToClear.forEach(cookieName => {
            response.cookies.set(cookieName, '', {
                path: '/',
                maxAge: 0
            });
            
            response.cookies.set(cookieName, '', {
                path: '/',
                domain: 'localhost',
                maxAge: 0
            });
            
            response.cookies.set(cookieName, '', {
                path: '/api',
                maxAge: 0
            });
        });
        
        logger.info('Logout successful');
        return response;
    } catch (error) {
        console.error('Logout error:', error);
        logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
        return handleServerError(error);
    }
} 