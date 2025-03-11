import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/server-errors";
import { withAuth } from "@/utils/auth-utils";
import { logger } from "@/utils/server-logger";
import { PrismaClient } from "@prisma/client";

// Type assertion to help TypeScript recognize the models
const prismaClient = prisma as PrismaClient;

/**
 * GET endpoint to fetch team roster by team name
 * Route: /api/teams/roster?teamName={teamName}
 */
export async function GET(request: Request) {
    return withAuth(request, async () => {
        try {
            const { searchParams } = new URL(request.url);
            const teamName = searchParams.get('teamName');
            
            if (!teamName) {
                return NextResponse.json(
                    { error: 'Team name is required' },
                    { status: 400 }
                );
            }
            
            logger.info('Team roster request by name', { teamName });
            
            // Find team by name
            const team = await prismaClient.team.findFirst({
                where: { name: teamName },
                include: { 
                    players: true 
                }
            });
            
            if (!team) {
                logger.warn('Team not found', { teamName });
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

            logger.info('Team roster fetched by name', { 
                teamName,
                teamId: team.id, 
                playerCount: formattedPlayers.length 
            });
            
            return NextResponse.json({
                success: true,
                data: formattedPlayers
            }, { status: 200 });
        } catch (error) {
            logger.error('Error fetching team roster by name', error instanceof Error ? error : new Error(String(error)));
            return handleServerError(error);
        }
    });
} 