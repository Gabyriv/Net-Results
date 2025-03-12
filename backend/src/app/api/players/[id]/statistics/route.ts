import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../config/prisma-server";
import { handleServerError } from "../../../errors_handlers/server-errors";
import { withAuth } from "../../../../../utils/auth-utils";
import { PlayerStatistics } from "@prisma/client";

// Define session type for consistency
type SessionType = {
    userId: string;
    userEmail: string;
    userRole: string;
    userMetadata: Record<string, unknown>;
};

// Define statistics type
interface DerivedStatistics extends PlayerStatistics {
    derived: {
        hittingPercentage: number;
        servicePercentage: number;
        blockEfficiency: number;
        digEfficiency: number;
        setEfficiency: number;
        receiveEfficiency: number;
    };
}

/**
 * Get player statistics
 */
export async function GET(
    request: Request, 
    { params }: { params: { id: string } }
) {
    return withAuth(request, async (session: SessionType) => {
        try {
            const playerId = params.id;
            const { searchParams } = new URL(request.url);
            const matchId = searchParams.get('matchId');
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
            
            if (matchId) {
                where.matchId = matchId;
            }
            
            if (season) {
                where.match = {
                    season
                };
            }

            // Get statistics
            const statistics = await prismaClient.playerStatistics.findMany({
                where,
                include: {
                    match: {
                        select: {
                            id: true,
                            date: true,
                            homeTeam: { select: { name: true } },
                            awayTeam: { select: { name: true } },
                            homeScore: true,
                            awayScore: true,
                            season: true
                        }
                    }
                },
                orderBy: [
                    { match: { date: 'desc' } }
                ]
            });

            // Calculate derived statistics
            const derivedStats: DerivedStatistics[] = statistics.map(stat => ({
                ...stat,
                derived: {
                    hittingPercentage: calculateHittingPercentage(stat),
                    servicePercentage: calculateServicePercentage(stat),
                    blockEfficiency: calculateBlockEfficiency(stat),
                    digEfficiency: calculateDigEfficiency(stat),
                    setEfficiency: calculateSetEfficiency(stat),
                    receiveEfficiency: calculateReceiveEfficiency(stat)
                }
            }));

            return NextResponse.json({ 
                success: true, 
                data: derivedStats 
            }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

// Utility functions for calculating derived statistics

function calculateHittingPercentage(stats: PlayerStatistics) {
    if (stats.totalAttacks === 0) return 0;
    return ((stats.kills - stats.attackErrors) / stats.totalAttacks) * 100;
}

function calculateServicePercentage(stats: PlayerStatistics) {
    if (stats.totalServes === 0) return 0;
    return ((stats.totalServes - stats.serviceErrors) / stats.totalServes) * 100;
}

function calculateBlockEfficiency(stats: PlayerStatistics) {
    if (stats.totalBlocks === 0) return 0;
    return (stats.blockPoints / stats.totalBlocks) * 100;
}

function calculateDigEfficiency(stats: PlayerStatistics) {
    if (stats.totalDigs === 0) return 0;
    return (stats.digSuccess / stats.totalDigs) * 100;
}

function calculateSetEfficiency(stats: PlayerStatistics) {
    if (stats.totalSets === 0) return 0;
    return (stats.setSuccess / stats.totalSets) * 100;
}

function calculateReceiveEfficiency(stats: PlayerStatistics) {
    if (stats.totalReceives === 0) return 0;
    return (stats.receiveSuccess / stats.totalReceives) * 100;
}