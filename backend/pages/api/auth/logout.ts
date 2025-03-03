import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/logger';

type ResponseData = {
    success?: boolean;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    // Only allow POST method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    logger.info('Logout attempt', { path: '/api/auth/logout' });
    console.log('Logout attempt received');

    try {
        // Create Supabase client
        const supabase = await createClient(null);
        
        // Sign out the user
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            logger.warn('Logout failed', { error: error.message });
            return res.status(500).json({ error: 'Failed to logout' });
        }

        // Clear all auth-related cookies
        const cookiesToClear = [
            'auth_token',
            'sb-access-token',
            'sb-refresh-token'
        ];

        cookiesToClear.forEach(cookieName => {
            res.setHeader('Set-Cookie', [
                `${cookieName}=; Path=/; Max-Age=0`,
                `${cookieName}=; Path=/; Domain=localhost; Max-Age=0`,
                `${cookieName}=; Path=/api; Max-Age=0`
            ]);
        });
        
        logger.info('Logout successful');
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
        
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
}
