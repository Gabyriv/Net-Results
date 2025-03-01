import { NextResponse } from "next/server";
import { prisma } from "../../../config/prisma";
import { handleServerError } from "../errors_handlers/errors";
import { GameSchema } from "../types/types";
import { withAuth } from "../../../utils/auth-utils";


export async function POST(request: Request) {
    return withAuth(request, async (session) => {
        try {
            const body = await request.json();
            const validated = GameSchema.parse(body);

            // Check if team exists and user has permission
            const team = await prisma.team.findUnique({
                where: { id: validated.teamId },
                select: { 
                    id: true,
                    createdById: true,
                    gamesPlayed: true,
                    wins: true,
                    losses: true,
                    draws: true
                }
            });

            if (!team) {
                return NextResponse.json(
                    { error: 'Team not found' },
                    { status: 404 }
                );
            }

            // Only team creator or admin can add games
            if (team.createdById !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to add games to this team' },
                    { status: 403 }
                );
            }

            // Start a transaction to update both game and team stats
            const result = await prisma.$transaction(async (tx) => {
                // Create the game
                const game = await tx.game.create({
                    data: validated,
                    include: {
                        team: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });

                // Update team stats
                const statsUpdate = {
                    gamesPlayed: team.gamesPlayed + 1,
                    wins: team.wins + (validated.result === 'Win' ? 1 : 0),
                    losses: team.losses + (validated.result === 'Loss' ? 1 : 0),
                    draws: team.draws + (validated.result === 'Draw' ? 1 : 0)
                };

                await tx.team.update({
                    where: { id: team.id },
                    data: statsUpdate
                });

                return game;
            });

            return NextResponse.json({ success: true, data: result }, { status: 201 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Get all games
 *     description: Retrieves a list of all games, optionally filtered by team
 *     tags:
 *       - Games
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Optional team ID to filter games
 *     responses:
 *       200:
 *         description: List of games retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
    return withAuth(async () => {
        try {
            const { searchParams } = new URL(request.url);
            const teamId = searchParams.get('teamId');

            const where = teamId ? { teamId } : {};

            const games = await prisma.game.findMany({
                where,
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: [
                    { createdAt: 'desc' }
                ]
            });

            return NextResponse.json({ success: true, data: games }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}
