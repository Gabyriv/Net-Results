import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { GameUpdateSchema } from "../../types/types";
import { withAuth } from "@/utils/auth-utils";


export async function GET(request: Request, { params }: { params: { id: string } }) {
    return withAuth(request, async () => {
        try {
            const game = await prisma.game.findUnique({
                where: { id: params.id },
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true,
                            createdById: true
                        }
                    }
                }
            });

            if (!game) {
                return NextResponse.json(
                    { error: 'Game not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: game }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

/**
 * @swagger
 * /api/games/{id}:
 *   put:
 *     summary: Update a game
 *     description: Updates a game's information and team stats
 *     tags:
 *       - Games
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               opponent:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               result:
 *                 type: string
 *                 enum: [Win, Loss, Draw]
 *     responses:
 *       200:
 *         description: Game updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not team owner or admin
 *       404:
 *         description: Game not found
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (session) => {
        try {
            const body = await request.json();
            const validated = GameUpdateSchema.parse(body);

            // Get current game and team info
            const currentGame = await prisma.game.findUnique({
                where: { id: params.id },
                include: {
                    team: {
                        select: {
                            id: true,
                            createdById: true,
                            gamesPlayed: true,
                            wins: true,
                            losses: true,
                            draws: true
                        }
                    }
                }
            });

            if (!currentGame) {
                return NextResponse.json(
                    { error: 'Game not found' },
                    { status: 404 }
                );
            }

            // Check permissions
            if (currentGame.team.createdById !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to update this game' },
                    { status: 403 }
                );
            }

            // If result is being changed, update team stats
            if (validated.result && validated.result !== currentGame.result) {
                // Start transaction to update both game and team stats
                const result = await prisma.$transaction(async (tx) => {
                    // Update game
                    const game = await tx.game.update({
                        where: { id: params.id },
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
                        wins: currentGame.team.wins + 
                            (validated.result === 'Win' ? 1 : 0) - 
                            (currentGame.result === 'Win' ? 1 : 0),
                        losses: currentGame.team.losses + 
                            (validated.result === 'Loss' ? 1 : 0) - 
                            (currentGame.result === 'Loss' ? 1 : 0),
                        draws: currentGame.team.draws + 
                            (validated.result === 'Draw' ? 1 : 0) - 
                            (currentGame.result === 'Draw' ? 1 : 0)
                    };

                    await tx.team.update({
                        where: { id: currentGame.team.id },
                        data: statsUpdate
                    });

                    return game;
                });

                return NextResponse.json({ success: true, data: result }, { status: 200 });
            } else {
                // If result isn't changing, just update the game
                const game = await prisma.game.update({
                    where: { id: params.id },
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

                return NextResponse.json({ success: true, data: game }, { status: 200 });
            }
        } catch (error) {
            return handleServerError(error);
        }
    });
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (session) => {
        try {
            const game = await prisma.game.findUnique({
                where: { id: params.id },
                include: {
                    team: {
                        select: {
                            id: true,
                            createdById: true,
                            gamesPlayed: true,
                            wins: true,
                            losses: true,
                            draws: true
                        }
                    }
                }
            });

            if (!game) {
                return NextResponse.json(
                    { error: 'Game not found' },
                    { status: 404 }
                );
            }

            // Check permissions
            if (game.team.createdById !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to delete this game' },
                    { status: 403 }
                );
            }

            // Start transaction to delete game and update team stats
            await prisma.$transaction(async (tx) => {
                // Delete the game
                await tx.game.delete({
                    where: { id: params.id }
                });

                // Update team stats
                const statsUpdate = {
                    gamesPlayed: game.team.gamesPlayed - 1,
                    wins: game.team.wins - (game.result === 'Win' ? 1 : 0),
                    losses: game.team.losses - (game.result === 'Loss' ? 1 : 0),
                    draws: game.team.draws - (game.result === 'Draw' ? 1 : 0)
                };

                await tx.team.update({
                    where: { id: game.team.id },
                    data: statsUpdate
                });
            });

            return NextResponse.json({ success: true }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}
