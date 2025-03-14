import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatType } from '@prisma/client';
import { withAuth } from '../../../../../utils/auth-utils';
import { prismaClient } from '../../../../../config/prisma-server';

// Define session type for consistency
type SessionType = {
    userId: string;
    userEmail: string;
    userRole: string;
    userMetadata: Record<string, unknown>;
};

// Interface for player stats
interface PlayerStat {
    id: string;
    playerId: string;
    gameId: string;
    teamId: string;
    statType: StatType;
    value: number;
    quality: string;
    createdAt: Date;
    updatedAt: Date;
    Game?: {
        id: string;
        game: string;
        created_at: Date;
        season?: string | null;
    };
}

/**
 * Get player statistics
 */
export async function GET(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (session: SessionType) => {
        try {
            // First, ensure we have valid params object by awaiting it
            const resolvedParams = await params;
            const playerId = resolvedParams.id;
            
            const { searchParams } = new URL(request.url);
            const gameId = searchParams.get('gameId');
            const season = searchParams.get('season');

            // Validate player exists
            const player = await prismaClient.player.findUnique({
                where: { id: playerId }
            });

            if (!player) {
                return NextResponse.json(
                    { error: 'Player not found' },
                    { status: 404 }
                );
            }

            // Build query conditions
            const where: any = { playerId };
            
            if (gameId) {
                where.gameId = gameId;
            }
            
            // Note: This approach depends on how season is stored in your Game model
            // Adjust as needed based on your schema
            if (season) {
                where.Game = {
                    season
                };
            }

            // Get statistics using the correct model name and fields
            const statistics = await prismaClient.playerStats.findMany({
                where,
                include: {
                    Game: {
                        select: {
                            id: true,
                            game: true,
                            created_at: true,
                            season: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Format stats for response
            const formattedStats = statistics.map((stat: PlayerStat) => ({
                id: stat.id,
                playerId: stat.playerId,
                gameId: stat.gameId,
                statType: stat.statType,
                value: stat.value,
                quality: stat.quality,
                gameName: stat.Game?.game || `Game ${stat.gameId}`,
                date: stat.Game?.created_at || stat.createdAt,
                season: stat.Game?.season || 'Unknown Season'
            }));

            return NextResponse.json({ 
                success: true, 
                data: formattedStats 
            });
        } catch (error) {
            console.error('Error fetching player statistics:', error);
            
            return NextResponse.json(
                { 
                    error: 'Failed to fetch player statistics',
                    message: error instanceof Error ? error.message : String(error)
                },
                { status: 500 }
            );
        }
    });
}