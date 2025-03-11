import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/server-errors";
import { withAuth } from "@/utils/auth-utils";
import { logger } from "@/utils/server-logger";
import { PrismaClient } from "@prisma/client";

// Type assertion to help TypeScript recognize the models
const prismaClient = prisma as PrismaClient;

/**
 * GET endpoint to fetch team roster by team ID
 * Route: /api/teams/{id}/roster
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    return withAuth(request, async () => {
        try {
            const teamId = params.id;
            
            logger.info('Team roster request by ID', { teamId });
            
            // Find team by ID
            const team = await prismaClient.team.findUnique({
                where: { id: teamId },
                include: { 
                    players: true 
                }
            });
            
            if (!team) {
                logger.warn('Team not found', { teamId });
                return NextResponse.json(
                    { error: 'Team not found' },
                    { status: 404 }
                );
            }

            // Format players to match the frontend expectations
            const formattedPlayers = team.players.map(player => ({
                id: player.id,
                name: player.displayName,
                jerseyNumber: player.number?.toString() || '0'
            }));

            logger.info('Team roster fetched by ID', { 
                teamId, 
                playerCount: formattedPlayers.length 
            });
            
            return NextResponse.json({
                success: true,
                data: formattedPlayers
            }, { status: 200 });
        } catch (error) {
            logger.error('Error fetching team roster by ID', error instanceof Error ? error : new Error(String(error)));
            return handleServerError(error);
        }
    });
} 