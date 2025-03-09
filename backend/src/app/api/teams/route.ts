import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/server-errors";
import { withAuth } from "@/utils/auth-utils";
import { logger } from "@/utils/server-logger";
import { PrismaClient } from "@prisma/client";

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

            // Get user from database to check role
            const dbUser = await prismaClient.user.findUnique({
                where: { id: session.userId },
                include: { manager: true }
            });
            
            if (!dbUser) {
                logger.warn('User not found', { userId: session.userId });
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

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