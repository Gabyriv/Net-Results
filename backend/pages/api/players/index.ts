import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/config/prisma';
import { createClient } from '@/utils/supabase/server';
import { getTokenFromRequest } from '@/utils/auth-utils';
import { logger } from '@/utils/logger';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const token = getTokenFromRequest(req);
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create Supabase client
    const supabase = await createClient(token);
    
    // Validate token by getting the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
        logger.warn('Invalid token', { error: authError?.message });
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from database to check role - using email to match user
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { manager: true }
    });

    if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    switch (req.method) {
        case 'GET':
            try {
                logger.info('Fetching players');
                
                // Get query parameters
                const { unassigned } = req.query;
                
                // Build the query
                const where = unassigned === 'true' 
                    ? { teamId: null } // Only get players without a team
                    : {}; // Get all players
                
                const players = await prisma.player.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                email: true,
                                displayName: true
                            }
                        },
                        team: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });
                
                logger.info('Players fetched successfully', { count: players.length });
                return res.status(200).json(players);
            } catch (error) {
                console.error('Prisma error:', error);
                logger.error('Error fetching players', 
                    error instanceof Error ? error : new Error('Unknown error')
                );
                return res.status(500).json({ error: 'Failed to fetch players. Please try again later.' });
            }

        default:
            res.setHeader('Allow', ['GET']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}
