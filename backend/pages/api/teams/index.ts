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

    console.log('Supabase user:', { id: user.id, email: user.email });

    // Get user from database to check role - using email to match user
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { manager: true }
    });

    if (!dbUser) {
        console.log('User not found in database with email:', user.email);
        return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Found user in database:', { id: dbUser.id, email: dbUser.email, role: dbUser.role });

    switch (req.method) {
        case 'GET':
            try {
                const { managerId, myTeams } = req.query;
                logger.info('Fetching teams', { managerId, myTeams });
                
                // First verify prisma connection
                await prisma.$connect();
                
                // Build the query filter
                const filter: { managerId?: string } = {};
                
                // If managerId is provided, filter by that specific manager
                if (managerId && typeof managerId === 'string') {
                    filter.managerId = managerId;
                    logger.info('Filtering teams by manager ID', { managerId });
                }
                
                // If myTeams=true is provided and user is a manager, filter by current user's manager ID
                if (myTeams === 'true' && dbUser.role === 'Manager' && dbUser.manager) {
                    filter.managerId = dbUser.manager.id;
                    logger.info('Filtering teams for current manager', { managerId: dbUser.manager.id });
                }
                
                const teams = await prisma.team.findMany({
                    where: filter,
                    include: {
                        players: true,
                        manager: {
                            select: {
                                displayName: true,
                                id: true
                            }
                        }
                    }
                });
                
                logger.info('Teams fetched successfully', { count: teams.length, filter });
                return res.status(200).json(teams);
            } catch (error) {
                console.error('Prisma error:', error);
                logger.error('Error fetching teams', 
                    error instanceof Error ? error : new Error('Unknown error')
                );
                return res.status(500).json({ error: 'Failed to fetch teams. Please try again later.' });
            }

        case 'POST':
            // Only managers can create teams
            if (dbUser.role !== 'Manager' || !dbUser.manager) {
                return res.status(403).json({ error: 'Only managers can create teams' });
            }

            try {
                const { name, playerIds, newPlayers } = req.body;
                
                if (!name || typeof name !== 'string' || name.trim().length === 0) {
                    return res.status(400).json({ error: 'Team name is required' });
                }

                console.log('Creating team with players:', playerIds);
                if (newPlayers && newPlayers.length > 0) {
                    console.log('Creating team with new players:', newPlayers);
                }
                
                // Create the team first
                const team = await prisma.team.create({
                    data: {
                        id: `team_${Date.now()}`,
                        name: name.trim(),
                        managerId: dbUser.manager.id
                    },
                    include: {
                        players: true,
                        manager: {
                            select: {
                                displayName: true
                            }
                        }
                    }
                });
                
                // If playerIds were provided, assign existing players to the team
                if (playerIds && Array.isArray(playerIds) && playerIds.length > 0) {
                    console.log(`Assigning ${playerIds.length} existing players to team ${team.id}`);
                    
                    // Update each player to assign them to this team
                    await prisma.player.updateMany({
                        where: {
                            id: {
                                in: playerIds
                            }
                        },
                        data: {
                            teamId: team.id
                        }
                    });
                }
                
                // If new players were provided, create them and assign to the team
                if (newPlayers && Array.isArray(newPlayers) && newPlayers.length > 0) {
                    console.log(`Creating ${newPlayers.length} new players for team ${team.id}`);
                    
                    // Create new players with User records
                    const newPlayerRecords = await Promise.all(newPlayers.map(async (player) => {
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
                                                id: team.id
                                            }
                                        },
                                        // Add jersey number if provided
                                        ...(player.number && { jerseyNumber: player.number.toString() })
                                    }
                                }
                            },
                            include: {
                                player: true
                            }
                        });
                        
                        return newUser.player;
                    }));
                    
                    console.log(`Created ${newPlayerRecords.length} new players`);
                }
                
                // Fetch the updated team with all players
                const updatedTeam = await prisma.team.findUnique({
                    where: { id: team.id },
                    include: {
                        players: true,
                        manager: {
                            select: {
                                displayName: true
                            }
                        }
                    }
                });
                
                return res.status(201).json(updatedTeam);
            } catch (error) {
                logger.error('Error creating team', 
                    error instanceof Error ? error : new Error('Unknown error')
                );
                return res.status(500).json({ error: 'Failed to create team' });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}
