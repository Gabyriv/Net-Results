import { NextResponse } from "next/server";
import { prisma } from "../../../config/prisma";
import { handleServerError } from "../errors_handlers/server-errors";
import { withAuth } from "../../../utils/auth-utils";
import { PrismaClient } from "@prisma/client";

// Type assertion to help TypeScript recognize the models
const prismaClient = prisma as PrismaClient;

export async function POST(request: Request) {
    return withAuth(request, async (session) => {
        try {
            const body = await request.json();
            
            // Get the next available ID
            const lastGame = await prismaClient.game.findFirst({
                orderBy: {
                    id: 'desc'
                }
            });
            
            const nextId = lastGame ? lastGame.id + 1 : 1;
            
            // Create the game with the required fields
            const game = await prismaClient.game.create({
                data: {
                    id: nextId,
                    game: body.game,
                    myTeam: body.myTeam,
                    myPts: body.myPts,
                    oppTeam: body.oppTeam,
                    oppPts: body.oppPts,
                    sets: body.sets,
                    created_at: body.created_at ? new Date(body.created_at) : new Date()
                }
            });

            return NextResponse.json({ success: true, data: game }, { status: 201 });
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
 *     description: Retrieves a list of all games
 *     tags:
 *       - Games
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of games retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
    return withAuth(request, async () => {
        try {
            const games = await prismaClient.game.findMany({
                orderBy: [
                    { created_at: 'desc' }
                ]
            });

            return NextResponse.json({ success: true, data: games }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}
