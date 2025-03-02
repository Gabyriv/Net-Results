import { NextApiRequest, NextApiResponse } from 'next';
import { getTokenFromRequest } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/logger';

type ResponseData = {
    valid?: boolean;
    user?: any;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    // Only allow GET method
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    logger.info('Token validation attempt', { path: '/api/auth/validate' });
    console.log('Token validation attempt received');

    try {
        // Get token from request (cookies or Authorization header)
        const token = getTokenFromRequest(req);
        
        if (!token) {
            logger.warn('No token provided for validation');
            return res.status(401).json({ valid: false, error: 'No token provided' });
        }

        // Create Supabase client
        const supabase = createClient();
        
        // Validate token by getting the user
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data.user) {
            logger.warn('Invalid token', { error: error?.message });
            return res.status(401).json({ valid: false, error: 'Invalid token' });
        }

        // Get user data from database to include role
        const { prisma } = await import("@/config/prisma");
        const user = await prisma.user.findUnique({
            where: { email: data.user.email },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true
            }
        });

        if (!user) {
            logger.warn('User found in auth but not in database', { 
                email: data.user.email 
            });
            return res.status(401).json({ valid: false, error: 'User account incomplete' });
        }

        // Merge user data with auth data
        const enrichedUser = {
            ...data.user,
            role: user.role,
            displayName: user.displayName,
            user_metadata: {
                ...data.user.user_metadata,
                role: user.role,
                displayName: user.displayName
            }
        };

        logger.info('Token validation successful', { 
            userId: user.id,
            role: user.role
        });

        return res.status(200).json({ valid: true, user: enrichedUser });
    } catch (error) {
        console.error('Token validation error:', error);
        logger.error('Token validation error', error instanceof Error ? error : new Error(String(error)));
        
        return res.status(500).json({ 
            valid: false, 
            error: 'Internal server error' 
        });
    }
}
