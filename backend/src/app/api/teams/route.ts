import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/server-errors";
import { withAuth } from "@/utils/auth-utils";
import { logger } from "@/utils/server-logger";
import { PrismaClient, Role } from "@prisma/client";

// Type assertion to help TypeScript recognize the models
const prismaClient = prisma as PrismaClient;


export async function GET(request: Request) {
    return withAuth(request, async (session) => {
        try {
            const { searchParams } = new URL(request.url);
            const managerId = searchParams.get('managerId');
            const myTeams = searchParams.get('myTeams') === 'true';
            
            logger.info('Teams fetch request', { 
                userId: session.userId, 
                managerId: managerId, 
                myTeams: myTeams 
            });

            // Debug log to see the exact user ID being looked up
            console.log('Looking up user with ID:', session.userId);

            // Get user from database to check role
            let dbUser = await prismaClient.user.findUnique({
                where: { id: session.userId },
                include: { manager: true }
            });
            
            if (!dbUser) {
                // Debug log to see why user wasn't found
                console.log('User not found in database with ID:', session.userId);
                
                // Let's log all user IDs in the database to see what we have
                const allUsers = await prismaClient.user.findMany({
                    select: { id: true, email: true }
                });
                console.log('Available users in database:', allUsers);
                
                logger.warn('User not found - attempting to fix ID mismatch', { userId: session.userId });
                
                // First check if a user with the same email already exists
                const existingUserWithEmail = await prismaClient.user.findFirst({
                    where: { email: session.userEmail },
                    include: { manager: true }
                });
                
                if (existingUserWithEmail) {
                    logger.info('Found user with matching email but different ID', { 
                        existingId: existingUserWithEmail.id, 
                        supabaseId: session.userId,
                        email: session.userEmail 
                    });
                    
                    try {
                        // Update the existing user's ID to match the Supabase ID
                        const updatedUser = await prismaClient.user.update({
                            where: { id: existingUserWithEmail.id },
                            data: { id: session.userId },
                            include: { manager: true }
                        });
                        
                        logger.info('Updated user ID to match Supabase ID', { 
                            oldId: existingUserWithEmail.id,
                            newId: updatedUser.id
                        });
                        
                        // Use the updated user
                        dbUser = updatedUser;
                        
                        // If the user is a Manager but doesn't have a manager record, create one
                        if (updatedUser.role === 'Manager' && !updatedUser.manager) {
                            const manager = await prismaClient.manager.create({
                                data: {
                                    id: `mgr_${Date.now()}`,
                                    displayName: updatedUser.displayName,
                                    userId: updatedUser.id
                                }
                            });
                            
                            logger.info('Created missing manager record', { 
                                userId: updatedUser.id, 
                                managerId: manager.id 
                            });
                            
                            // Update dbUser with manager data
                            dbUser = await prismaClient.user.findUnique({
                                where: { id: session.userId },
                                include: { manager: true }
                            });
                        }
                    } catch (updateError) {
                        // If update fails (likely due to foreign key constraints), try a different approach
                        logger.error(`Failed to update user ID: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
                        
                        // As a fallback solution, we'll update the Supabase ID in our auth system  
                        logger.info('Falling back to using the existing user record as-is');
                        dbUser = existingUserWithEmail;
                    }
                } else {
                    // No user with this email exists, so create a new user
                    try {
                        const newUser = await prismaClient.user.create({
                            data: {
                                id: session.userId,
                                email: session.userEmail,
                                displayName: session.userMetadata.displayName as string || session.userEmail.split('@')[0],
                                role: session.userRole as Role,
                                password: 'imported-from-supabase' // Placeholder as we don't have access to the actual password
                            }
                        });
                        
                        logger.info('Created missing user from Supabase data', { 
                            userId: newUser.id, 
                            email: newUser.email 
                        });
                        
                        // If user is a Manager, create manager record
                        if (session.userRole === 'Manager') {
                            const manager = await prismaClient.manager.create({
                                data: {
                                    id: `mgr_${Date.now()}`,
                                    displayName: newUser.displayName,
                                    userId: newUser.id
                                }
                            });
                            
                            logger.info('Created missing manager record', { 
                                userId: newUser.id, 
                                managerId: manager.id 
                            });
                            
                            // Update dbUser with our newly created user
                            const userWithManager = await prismaClient.user.findUnique({
                                where: { id: session.userId },
                                include: { manager: true }
                            });
                            
                            // This should never be null, but we'll check to satisfy TypeScript
                            if (userWithManager) {
                                dbUser = userWithManager;
                            } else {
                                dbUser = {
                                    ...newUser,
                                    manager: null
                                };
                            }
                        } else {
                            // Update dbUser with our newly created user that doesn't have manager data
                            dbUser = {
                                ...newUser,
                                manager: null
                            };
                        }
                    } catch (createError) {
                        const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
                        logger.error(`Failed to create missing user for ID ${session.userId}: ${errorMessage}`);
                        
                        return NextResponse.json(
                            { error: 'User not found and automatic creation failed' },
                            { status: 404 }
                        );
                    }
                }
            }

            // At this point, dbUser should always be defined
            logger.info('User found', { 
                userId: dbUser.id, 
                role: dbUser.role, 
                managerRecord: dbUser.manager ? true : false 
            });

            // Build query based on filters
            let where = {};
            
            // If managerId is provided, filter by that
            if (managerId) {
                where = { managerId };
                logger.info('Filtering by provided managerId', { managerId });
            }
            // If myTeams is true and user is a manager, show only their teams
            else if (myTeams && dbUser.role === 'Manager') {
                if (!dbUser.manager) {
                    logger.warn('User has Manager role but no manager record', { userId: dbUser.id });
                    
                    // Create manager record if it doesn't exist
                    const manager = await prismaClient.manager.create({
                        data: {
                            id: `mgr_${Date.now()}`,
                            displayName: dbUser.displayName,
                            userId: dbUser.id
                        }
                    });
                    
                    logger.info('Created missing manager record', { 
                        userId: dbUser.id, 
                        managerId: manager.id 
                    });
                    
                    where = { managerId: manager.id };
                } else {
                    logger.info('Filtering by user managerId', { managerId: dbUser.manager.id });
                    where = { managerId: dbUser.manager.id };
                }
            }

            // Get teams
            const teams = await prismaClient.team.findMany({
                where,
                include: {
                    players: true,
                    manager: {
                        select: {
                            id: true,
                            displayName: true
                        }
                    }
                }
            });

            logger.info('Teams fetched successfully', { count: teams.length });
            return NextResponse.json({ success: true, data: teams }, { status: 200 });
        } catch (error) {
            logger.error('Error fetching teams', error instanceof Error ? error : new Error(String(error)));
            return handleServerError(error);
        }
    });
}


export async function POST(request: Request) {
    return withAuth(request, async (session) => {
        try {
            logger.info('Team creation request', { userId: session.userId });
            
            // Get user from database to check role
            const dbUser = await prismaClient.user.findUnique({
                where: { id: session.userId },
                include: { manager: true }
            });
            
            if (!dbUser) {
                logger.warn('User not found during team creation', { userId: session.userId });
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // Check if user is a manager
            if (dbUser.role !== 'Manager') {
                logger.warn('Non-manager attempted to create team', { 
                    userId: dbUser.id, 
                    role: dbUser.role 
                });
                return NextResponse.json(
                    { error: 'Only managers can create teams' },
                    { status: 403 }
                );
            }

            // Check if manager record exists, create one if it doesn't
            let managerRecord = dbUser.manager;
            if (!managerRecord) {
                logger.info('Creating missing manager record for user', { userId: dbUser.id });
                managerRecord = await prismaClient.manager.create({
                    data: {
                        id: `mgr_${Date.now()}`,
                        displayName: dbUser.displayName,
                        userId: dbUser.id
                    }
                });
            }

            const body = await request.json();
            const { name, playerIds = [], newPlayers = [] } = body;

            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return NextResponse.json(
                    { error: 'Team name is required' },
                    { status: 400 }
                );
            }

            // Generate a unique ID for the team
            const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            // Create the team
            const team = await prismaClient.team.create({
                data: {
                    id: teamId,
                    name: name.trim(),
                    managerId: managerRecord.id,
                    // Connect existing players if playerIds are provided
                    players: playerIds.length > 0 ? {
                        connect: playerIds.map((id: string) => ({ id }))
                    } : undefined
                },
                include: {
                    manager: {
                        select: {
                            displayName: true
                        }
                    },
                    players: true
                }
            });

            // Log the successful team creation
            logger.info('Team created', { teamId, managerId: managerRecord.id });
            
            // If there are new players to create, redirect to the player creation endpoint
            if (newPlayers && Array.isArray(newPlayers) && newPlayers.length > 0) {
                logger.info('New players to be created', { count: newPlayers.length });
                
                try {
                    // Create a request to the player creation endpoint
                    const playerEndpoint = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/teams/${teamId}/players`;
                    
                    // Make the request to create players
                    const response = await fetch(playerEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': request.headers.get('Authorization') || ''
                        },
                        body: JSON.stringify({ newPlayers })
                    });
                    
                    if (!response.ok) {
                        logger.warn('Failed to create players', { 
                            status: response.status,
                            teamId
                        });
                    } else {
                        logger.info('Players created successfully', { teamId });
                    }
                } catch (error) {
                    logger.error('Error creating players', error instanceof Error ? error : new Error(String(error)));
                }
            }

            return NextResponse.json({ success: true, data: team }, { status: 201 });
        } catch (error) {
            logger.error('Error creating team', error instanceof Error ? error : new Error(String(error)));
            return handleServerError(error);
        }
    });
} 