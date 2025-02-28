import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
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
 *       403:
 *         description: Forbidden - Not team owner, player, or admin
 *       404:
 *         description: Player not found
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
    console.log('GET /api/players/id - Starting request for ID:', params.id);

    return withAuth(request, async (session) => {
        console.log('GET /api/players/id - Authenticated with session:', JSON.stringify(session));

        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid player ID' },
                    { status: 400 }
                );
            }

            const player = await prisma.player.findUnique({
                where: { id: params.id },
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true,
                            managerId: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            displayName: true,
                            role: true
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

            // Check if user has permission to view this player
            // Allow if:
            // 1. User is a Manager
            // 2. User is the team manager
            // 3. User is the player (user.id matches player.userId)
            const isManager = session.userRole === 'Manager';
            const isTeamManager = player.team.managerId === session.userId;
            const isPlayer = player.userId === session.userId;

            if (!isManager && !isTeamManager && !isPlayer) {
                console.log('GET /api/players/id - Access denied: Not manager, team manager, or the player');
                return NextResponse.json(
                    { error: 'You do not have permission to view this player' },
                    { status: 403 }
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
    return withAuth(request, async (session) => {
        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid player ID' },
                    { status: 400 }
                );
            }

            // Get current player and team info
            const currentPlayer = await prisma.player.findUnique({
                where: { id: params.id },
                include: {
                    team: {
                        select: {
                            id: true,
                            managerId: true
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
            // Allow if:
            // 1. User is a Manager
            // 2. User is the team creator
            const isManager = session.userRole === 'Manager';
            const isTeamCreator = currentPlayer.team.managerId === session.userId;

            if (!isManager && !isTeamCreator) {
                return NextResponse.json(
                    { error: 'You do not have permission to update this player' },
                    { status: 403 }
                );
            }

            const body = await request.json();
            const validated = PlayerUpdateSchema.safeParse(body);

            if (!validated.success) {
                return NextResponse.json(
                    { error: 'Invalid data format', details: validated.error.format() },
                    { status: 400 }
                );
            }

            // If changing teams, verify the new team exists and user has permission
            if (validated.data.teamId && validated.data.teamId !== currentPlayer.teamId) {
                const newTeam = await prisma.team.findUnique({
                    where: { id: validated.data.teamId },
                    select: { managerId: true }
                });

                if (!newTeam) {
                    return NextResponse.json(
                        { error: 'New team not found' },
                        { status: 404 }
                    );
                }

                // Only allow if user is Manager or creator of both teams
                if (!isManager && newTeam.managerId !== session.userId) {
                    return NextResponse.json(
                        { error: 'You do not have permission to move this player to the specified team' },
                        { status: 403 }
                    );
                }
            }

            const player = await prisma.player.update({
                where: { id: params.id },
                data: {
                    ...(validated.data.displayName && { displayName: validated.data.displayName }),
                    ...(validated.data.gamesPlayed !== undefined && { gamesPlayed: validated.data.gamesPlayed }),
                    ...(validated.data.teamId && { teamId: validated.data.teamId })
                },
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            displayName: true,
                            role: true
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
    return withAuth(request, async (session) => {
        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid player ID' },
                    { status: 400 }
                );
            }

            const player = await prisma.player.findUnique({
                where: { id: params.id },
                include: {
                    team: {
                        select: {
                            managerId: true
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
            // Allow if:
            // 1. User is a Manager
            // 2. User is the team creator
            const isManager = session.userRole === 'Manager';
            const isTeamCreator = player.team.managerId === session.userId;

            if (!isManager && !isTeamCreator) {
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
