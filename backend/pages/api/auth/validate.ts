import { NextApiRequest, NextApiResponse } from 'next';
import { getTokenFromRequest } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/logger';

type ResponseData = {
    valid?: boolean;
    user?: Record<string, unknown>;
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
        const supabase = await createClient(token);
        
        // Set session manually using the token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
            console.error('Error getting user:', error);
            logger.warn('Error getting user from Supabase', { error: error.message });
            return res.status(401).json({ valid: false, error: 'Invalid token' });
        }
        
        if (error || !user) {
            logger.warn('Invalid token', { 
                errorMessage: error ? String(error) : undefined 
            });
            return res.status(401).json({ valid: false, error: 'Invalid token' });
        }

        // Get user data from database to include role
        const { prisma } = await import("@/config/prisma");
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true
            }
        });

        if (!dbUser) {
            logger.warn('User found in auth but not in database', { 
                email: user.email 
            });
            return res.status(401).json({ valid: false, error: 'User account incomplete' });
        }

        // Merge user data with auth data
        const enrichedUser = {
            ...user,
            role: dbUser.role,
            displayName: dbUser.displayName,
            user_metadata: {
                ...user.user_metadata,
                role: dbUser.role,
                displayName: dbUser.displayName
            }
        };

        logger.info('Token validation successful', { 
            userId: dbUser.id,
            role: dbUser.role
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
