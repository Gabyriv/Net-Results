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

            // Get user from database to check role
            const dbUser = await prismaClient.user.findUnique({
                where: { id: session.userId },
                include: { manager: true }
            });
            
            if (!dbUser) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // Build query based on filters
            let where = {};
            
            // If managerId is provided, filter by that
            if (managerId) {
                where = { managerId };
            }
            // If myTeams is true and user is a manager, show only their teams
            else if (myTeams && dbUser.role === 'Manager') {
                if (!dbUser.manager) {
                    logger.warn('User has Manager role but no manager record', { userId: dbUser.id });
                    where = { managerId: 'none' }; // This will return no teams, as no team should have this ID
                } else {
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

            return NextResponse.json({ success: true, data: teams }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}


export async function POST(request: Request) {
    return withAuth(request, async (session) => {
        try {
            // Get user from database to check role
            const dbUser = await prismaClient.user.findUnique({
                where: { id: session.userId },
                include: { manager: true }
            });
            
            if (!dbUser) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // Check if user is a manager
            if (dbUser.role !== 'Manager' || !dbUser.manager) {
                return NextResponse.json(
                    { error: 'Only managers can create teams' },
                    { status: 403 }
                );
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
                    managerId: dbUser.manager.id,
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
            logger.info('Team created', { teamId, managerId: dbUser.manager.id });
            
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
            return handleServerError(error);
        }
    });
} 