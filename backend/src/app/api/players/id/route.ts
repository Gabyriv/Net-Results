import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { PlayerUpdateSchema } from "../../types/types";
import { withAuth } from "@/utils/auth-utils";

/**
 * @swagger
 * /api/players/{id}:
 *   get:
 *     summary: Get a player by ID
 *     description: Retrieves a specific player's details
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Player not found
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async () => {
        try {
            const player = await prisma.player.findUnique({
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

            if (!player) {
                return NextResponse.json(
                    { error: 'Player not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: player }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

/**
 * @swagger
 * /api/players/{id}:
 *   put:
 *     summary: Update a player
 *     description: Updates a player's information
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               number:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 99
 *               teamId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Player updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not team owner or admin
 *       404:
 *         description: Player not found
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (session) => {
        try {
            const body = await request.json();
            const validated = PlayerUpdateSchema.parse(body);

            // Get current player and team info
            const currentPlayer = await prisma.player.findUnique({
                where: { id: params.id },
                include: {
                    team: {
                        select: {
                            id: true,
                            createdById: true
                        }
                    }
                }
            });

            if (!currentPlayer) {
                return NextResponse.json(
                    { error: 'Player not found' },
                    { status: 404 }
                );
            }

            // Check permissions
            if (currentPlayer.team.createdById !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to update this player' },
                    { status: 403 }
                );
            }

            // If number is being changed, check if it's available
            if (validated.number && validated.number !== currentPlayer.number) {
                const existingPlayer = await prisma.player.findFirst({
                    where: {
                        teamId: currentPlayer.teamId,
                        number: validated.number,
                        id: { not: params.id }
                    }
                });

                if (existingPlayer) {
                    return NextResponse.json(
                        { error: 'Player number is already taken in this team' },
                        { status: 400 }
                    );
                }
            }

            const player = await prisma.player.update({
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

            return NextResponse.json({ success: true, data: player }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

/**
 * @swagger
 * /api/players/{id}:
 *   delete:
 *     summary: Delete a player
 *     description: Deletes a player from the system
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not team owner or admin
 *       404:
 *         description: Player not found
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (session) => {
        try {
            const player = await prisma.player.findUnique({
                where: { id: params.id },
                include: {
                    team: {
                        select: {
                            createdById: true
                        }
                    }
                }
            });

            if (!player) {
                return NextResponse.json(
                    { error: 'Player not found' },
                    { status: 404 }
                );
            }

            // Check permissions
            if (player.team.createdById !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to delete this player' },
                    { status: 403 }
                );
            }

            await prisma.player.delete({
                where: { id: params.id }
            });

            return NextResponse.json({ success: true }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}