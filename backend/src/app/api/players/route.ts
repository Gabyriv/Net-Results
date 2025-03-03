import { NextResponse } from "next/server";
import { prismaClient } from "../../../config/prisma-server";
import { handleServerError } from "../errors_handlers/server-errors";
import { withAuth } from "../../../utils/auth-utils";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    return withAuth(request, async () => {
        try {
            // Get query parameters from URL
            const url = new URL(request.url);
            const unassigned = url.searchParams.get('unassigned') === 'true';
            
            // Build the query
            const where = unassigned 
                ? { teamId: null } // Only get players without a team
                : {}; // Get all players
            
            const players = await prismaClient.player.findMany({
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
            
            return NextResponse.json({ success: true, data: players }, { status: 200 });
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
                    { error: 'Only managers can create players' },
                    { status: 403 }
                );
            }

            const body = await request.json();
            const { displayName, teamId, jerseyNumber } = body;

            if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
                return NextResponse.json(
                    { error: 'Player name is required' },
                    { status: 400 }
                );
            }

            // Generate a unique ID for the player
            const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            // Create a new user for this player
            const newUserId = uuidv4();
            
            // Create the player
            const player = await prismaClient.player.create({
                data: {
                    id: playerId,
                    displayName: displayName.trim(),
                    gamesPlayed: 0,
                    ...(jerseyNumber ? { number: parseInt(jerseyNumber) } : {}),
                    teamId: teamId || null,
                    user: {
                        create: {
                            id: newUserId,
                            email: `player-${newUserId.substring(0, 8)}@example.com`,
                            password: "defaultPassword", // This should be hashed in production
                            displayName: displayName.trim(),
                            role: "Player"
                        }
                    }
                },
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            return NextResponse.json({ success: true, data: player }, { status: 201 });
        } catch (error) {
            return handleServerError(error);
        }
    });
} 