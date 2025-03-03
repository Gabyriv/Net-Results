import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/server-errors";
import { withAuth } from "@/utils/auth-utils";
import { logger } from "@/utils/server-logger";
import { PrismaClient } from "@prisma/client";

// Type assertion to help TypeScript recognize the models
const prismaClient = prisma as PrismaClient;

export async function GET(request: Request, { params }: { params: { id: string } }) {
    return withAuth(request, async () => {
        try {
            // Await the params.id to avoid Next.js warning
            const id = await Promise.resolve(params.id);
            
            const team = await prismaClient.team.findUnique({
                where: { id },
                include: {
                    players: true,
                    manager: true
                }
            });

            if (!team) {
                return NextResponse.json(
                    { error: 'Team not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: team }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    return withAuth(request, async (session) => {
        try {
            // Await the params.id to avoid Next.js warning
            const id = await Promise.resolve(params.id);
            
            if (!id) {
                return NextResponse.json(
                    { error: 'Invalid team ID' },
                    { status: 400 }
                );
            }

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

            // Get the team
            const team = await prismaClient.team.findUnique({
                where: { id },
                include: {
                    manager: true
                }
            });

            if (!team) {
                return NextResponse.json(
                    { error: 'Team not found' },
                    { status: 404 }
                );
            }

            // Check if user is the team's manager
            const isTeamManager = dbUser.role === 'Manager' && dbUser.manager?.id === team.managerId;
            if (!isTeamManager) {
                return NextResponse.json(
                    { error: 'Only the team manager can update the team' },
                    { status: 403 }
                );
            }

            const body = await request.json();
            const { name, playerIds, newPlayers } = body;

            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return NextResponse.json(
                    { error: 'Team name is required' },
                    { status: 400 }
                );
            }

            // Update team name
            const updatedTeam = await prismaClient.team.update({
                where: { id },
                data: { name: name.trim() },
            });

            // Handle player assignments if provided
            if (playerIds && Array.isArray(playerIds)) {
                // First, remove all current player associations
                await prismaClient.player.updateMany({
                    where: { teamId: id },
                    data: { teamId: null }
                });
                
                // Then assign the specified players to this team
                for (const playerId of playerIds) {
                    await prismaClient.player.update({
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
                    const newUser = await prismaClient.user.create({
                        data: {
                            id: userId,
                            email: `player_${Date.now()}@example.com`, // Placeholder email
                            password: Math.random().toString(36).substring(2, 15), // Random password
                            role: 'Player',
                            displayName: player.displayName,
                            player: {
                                create: {
                                    id: playerId,
                                    displayName: player.displayName,
                                    gamesPlayed: 0,
                                    team: {
                                        connect: {
                                            id: id
                                        }
                                    }
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
            const finalTeam = await prismaClient.team.findUnique({
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
            return NextResponse.json({ success: true, data: finalTeam }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    return withAuth(request, async (session) => {
        try {
            // Await the params.id to avoid Next.js warning
            const id = await Promise.resolve(params.id);
            
            if (!id) {
                return NextResponse.json(
                    { error: 'Invalid team ID' },
                    { status: 400 }
                );
            }

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

            // Get the team
            const team = await prismaClient.team.findUnique({
                where: { id },
                include: {
                    manager: true
                }
            });

            if (!team) {
                return NextResponse.json(
                    { error: 'Team not found' },
                    { status: 404 }
                );
            }

            // Check if user is the team's manager
            const isTeamManager = dbUser.role === 'Manager' && dbUser.manager?.id === team.managerId;
            if (!isTeamManager) {
                return NextResponse.json(
                    { error: 'Only the team manager can delete the team' },
                    { status: 403 }
                );
            }

            // First update any players to remove their team association
            await prismaClient.player.updateMany({
                where: { teamId: id },
                data: { teamId: null }
            });
            
            // Then delete the team
            await prismaClient.team.delete({
                where: { id }
            });

            logger.info('Team deleted', { teamId: id, managerId: dbUser.manager?.id });
            return NextResponse.json({ success: true, message: 'Team deleted successfully' }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
} 