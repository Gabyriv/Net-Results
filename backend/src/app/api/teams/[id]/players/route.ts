import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../config/prisma-server";
import { handleServerError } from "../../../errors_handlers/server-errors";
import { withAuth } from "../../../../../utils/auth-utils";
import { v4 as uuidv4 } from 'uuid';
import { Role } from "@prisma/client";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    return withAuth(request, async (session) => {
        try {
            // Await the params.id to avoid Next.js warning
            const teamId = await Promise.resolve(params.id);
            
            // Check if team exists
            const team = await prismaClient.team.findUnique({
                where: { id: teamId },
                include: { manager: true }
            });
            
            if (!team) {
                return NextResponse.json(
                    { error: 'Team not found' },
                    { status: 404 }
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

            // Check if user is the team's manager
            if (dbUser.role !== 'Manager' || !dbUser.manager || team.managerId !== dbUser.manager.id) {
                return NextResponse.json(
                    { error: 'Only the team manager can add players to this team' },
                    { status: 403 }
                );
            }

            const body = await request.json();
            const { playerIds = [], newPlayers = [] } = body;
            
            // Connect existing players to the team
            if (playerIds.length > 0) {
                await prismaClient.player.updateMany({
                    where: {
                        id: { in: playerIds }
                    },
                    data: {
                        teamId
                    }
                });
            }
            
            // Create new players if provided
            const createdPlayers = [];
            if (newPlayers && newPlayers.length > 0) {
                for (const playerData of newPlayers) {
                    try {
                        const newPlayer = await prismaClient.player.create({
                            data: {
                                id: uuidv4(),
                                displayName: playerData.name,
                                gamesPlayed: 0,
                                number: playerData.jerseyNumber ? parseInt(playerData.jerseyNumber) : null,
                                teamId: teamId,
                                user: {
                                    create: {
                                        id: uuidv4(),
                                        email: `player-${uuidv4()}@example.com`,
                                        password: "defaultPassword", // This should be hashed in production
                                        displayName: playerData.name,
                                        role: Role.Player
                                    }
                                }
                            }
                        });
                        createdPlayers.push(newPlayer);
                    } catch (error) {
                        console.error('Error creating player:', error);
                    }
                }
            }
            
            // Get updated team with all players
            const updatedTeam = await prismaClient.team.findUnique({
                where: { id: teamId },
                include: {
                    players: true,
                    manager: {
                        select: {
                            displayName: true
                        }
                    }
                }
            });
            
            return NextResponse.json({
                success: true,
                data: updatedTeam,
                addedPlayers: {
                    existing: playerIds.length,
                    new: createdPlayers.length
                }
            }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
} 