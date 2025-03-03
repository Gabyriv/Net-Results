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
    
    console.log('User found in database:', dbUser?.email, dbUser?.role);

    if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Get the team
    const team = await prisma.team.findUnique({
        where: { id },
        include: {
            players: true,
            manager: true
        }
    });

    if (!team) {
        return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is the team's manager for write operations
    const isTeamManager = dbUser.role === 'Manager' && dbUser.manager?.id === team.managerId;

    switch (req.method) {
        case 'GET':
            return res.status(200).json(team);

        case 'PUT':
            if (!isTeamManager) {
                return res.status(403).json({ error: 'Only the team manager can update the team' });
            }

            try {
                const { name, playerIds, newPlayers } = req.body;

                if (!name || typeof name !== 'string' || name.trim().length === 0) {
                    return res.status(400).json({ error: 'Team name is required' });
                }

                // Update team name
                const updatedTeam = await prisma.team.update({
                    where: { id },
                    data: { name: name.trim() },
                });

                // Handle player assignments if provided
                if (playerIds && Array.isArray(playerIds)) {
                    // First, remove all current player associations
                    await prisma.player.updateMany({
                        where: { teamId: id },
                        data: { teamId: null }
                    });
                    
                    // Then assign the specified players to this team
                    for (const playerId of playerIds) {
                        await prisma.player.update({
                            where: { id: playerId },
                            data: { teamId: id }
                        });
                    }
                }
                
                // Handle new players if provided
                if (newPlayers && Array.isArray(newPlayers) && newPlayers.length > 0) {
                    logger.info(`Creating ${newPlayers.length} new players for team ${id}`);
                    
                    // Create new players with User records
                    await Promise.all(newPlayers.map(async (player) => {
                        // Generate a unique ID for the user based on timestamp
                        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        // Generate a unique ID for the player
                        const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        
                        // Create a User record first
                        const newUser = await prisma.user.create({
                            data: {
                                id: userId,
                                email: `player_${Date.now()}@example.com`, // Placeholder email
                                password: Math.random().toString(36).substring(2, 15), // Random password
                                role: 'Player',
                                displayName: player.displayName,
                                player: {
                                    create: {
                                        id: playerId, // Add the required ID field
                                        displayName: player.displayName,
                                        gamesPlayed: 0,
                                        team: {
                                            connect: {
                                                id: id
                                            }
                                        },
                                        // Use number field instead of jerseyNumber
                                        ...(player.number && { number: parseInt(player.number.toString()) })
                                    }
                                }
                            },
                            include: {
                                player: true
                            }
                        });
                        
                        return newUser;
                    }));
                }
                
                // Fetch the updated team with all players
                const finalTeam = await prisma.team.findUnique({
                    where: { id },
                    include: {
                        players: true,
                        manager: {
                            select: {
                                displayName: true
                            }
                        }
                    }
                });

                logger.info('Team updated', { teamId: id, managerId: dbUser.manager?.id });
                return res.status(200).json(finalTeam);
            } catch (error) {
                logger.error('Error updating team', 
                    error instanceof Error ? error : new Error('Unknown error')
                );
                return res.status(500).json({ error: 'Failed to update team' });
            }

        case 'DELETE':
            if (!isTeamManager) {
                return res.status(403).json({ error: 'Only the team manager can delete the team' });
            }

            try {
                // First update any players to remove their team association
                await prisma.player.updateMany({
                    where: { teamId: id },
                    data: { teamId: null }
                });
                
                console.log(`Removed team association from players in team ${id}`);
                
                // Then delete the team
                await prisma.team.delete({
                    where: { id }
                });

                logger.info('Team deleted', { teamId: id, managerId: dbUser.manager?.id });
                return res.status(200).json({ message: 'Team deleted successfully' });
            } catch (error) {
                console.error('Error deleting team:', error);
                logger.error('Error deleting team', 
                    error instanceof Error ? error : new Error('Unknown error')
                );
                return res.status(500).json({ error: 'Failed to delete team. Please try again later.' });
            }

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}
