import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { PlayerSchema } from "../types/types";
import { withAuth } from "@/utils/auth-utils";

/**
 * @swagger
 * /api/players:
 *   post:
 *     summary: Create a new player
 *     description: Creates a new player for a team
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - number
 *               - teamId
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
 *       201:
 *         description: Player created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not team owner or admin
 *       404:
 *         description: Team not found
 */
export async function POST(request: Request) {
    return withAuth(async (session) => {
        try {
            const body = await request.json();
            const validated = PlayerSchema.parse(body);

            // Check if team exists and user has permission
            const team = await prisma.team.findUnique({
                where: { id: validated.teamId },
                select: { createdById: true }
            });

            if (!team) {
                return NextResponse.json(
                    { error: 'Team not found' },
                    { status: 404 }
                );
            }

            // Only team creator or admin can add players
            if (team.createdById !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to add players to this team' },
                    { status: 403 }
                );
            }

            // Check if player number is already taken in the team
            const existingPlayer = await prisma.player.findFirst({
                where: {
                    teamId: validated.teamId,
                    number: validated.number
                }
            });

            if (existingPlayer) {
                return NextResponse.json(
                    { error: 'Player number is already taken in this team' },
                    { status: 400 }
                );
            }

            const player = await prisma.player.create({
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

            return NextResponse.json({ success: true, data: player }, { status: 201 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Get all players
 *     description: Retrieves a list of all players, optionally filtered by team
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Optional team ID to filter players
 *     responses:
 *       200:
 *         description: List of players retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
    return withAuth(async () => {
        try {
            const { searchParams } = new URL(request.url);
            const teamId = searchParams.get('teamId');

            const where = teamId ? { teamId } : {};

            const players = await prisma.player.findMany({
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
                    { teamId: 'asc' },
                    { number: 'asc' }
                ]
            });

            return NextResponse.json({ success: true, data: players }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}