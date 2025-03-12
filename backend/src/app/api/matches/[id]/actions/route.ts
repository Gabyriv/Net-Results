import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../config/prisma-server";
import { handleServerError } from "../../../errors_handlers/server-errors";
import { withAuth } from "../../../../../utils/auth-utils";

// Define session type for consistency
type SessionType = {
    userId: string;
    userEmail: string;
    userRole: string;
    userMetadata: Record<string, unknown>;
};

/**
 * Record a new match action
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (session: SessionType) => {
        try {
            const { id: matchId } = await params;
            const body = await request.json();

            // Validate required fields
            if (!body.playerId || !body.actionType || !body.quality) {
                return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }

            // Validate action type
            const validActionTypes = ['SERVE', 'ATTACK', 'BLOCK', 'DIG', 'SET', 'RECEIVE'];
            if (!validActionTypes.includes(body.actionType)) {
                return NextResponse.json(
                    { error: 'Invalid action type' },
                    { status: 400 }
                );
            }

            // Validate quality
            const validQualities = ['+', '-', '='];
            if (!validQualities.includes(body.quality)) {
                return NextResponse.json(
                    { error: 'Invalid quality value' },
                    { status: 400 }
                );
            }

            // Create the match action
            const action = await prismaClient.matchAction.create({
                data: {
                    matchId,
                    playerId: body.playerId,
                    actionType: body.actionType,
                    quality: body.quality
                }
            });

            // Update player statistics
            await updatePlayerStatistics(matchId, body.playerId, body.actionType, body.quality);

            return NextResponse.json({ success: true, data: action }, { status: 201 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

/**
 * Get all actions for a match
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (session: SessionType) => {
        try {
            const { id: matchId } = await params;

            const actions = await prismaClient.matchAction.findMany({
                where: { matchId },
                include: {
                    player: {
                        select: {
                            id: true,
                            displayName: true,
                            number: true
                        }
                    }
                },
                orderBy: { timestamp: 'asc' }
            });

            return NextResponse.json({ success: true, data: actions }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

/**
 * Update player statistics based on a match action
 */
async function updatePlayerStatistics(matchId: string, playerId: string, actionType: string, quality: string) {
    // Get or create match-specific statistics
    let stats = await prismaClient.playerStatistics.findFirst({
        where: {
            playerId,
            matchId
        }
    });

    if (!stats) {
        stats = await prismaClient.playerStatistics.create({
            data: {
                playerId,
                matchId
            }
        });
    }

    // Update statistics based on action type and quality
    const updateData: any = {};

    switch (actionType) {
        case 'SERVE':
            updateData.totalServes = { increment: 1 };
            if (quality === '+') updateData.serviceAces = { increment: 1 };
            if (quality === '-') updateData.serviceErrors = { increment: 1 };
            break;
        case 'ATTACK':
            updateData.totalAttacks = { increment: 1 };
            if (quality === '+') updateData.kills = { increment: 1 };
            if (quality === '-') updateData.attackErrors = { increment: 1 };
            break;
        case 'BLOCK':
            updateData.totalBlocks = { increment: 1 };
            if (quality === '+') updateData.blockPoints = { increment: 1 };
            if (quality === '-') updateData.blockErrors = { increment: 1 };
            break;
        case 'DIG':
            updateData.totalDigs = { increment: 1 };
            if (quality === '+') updateData.digSuccess = { increment: 1 };
            if (quality === '-') updateData.digErrors = { increment: 1 };
            break;
        case 'SET':
            updateData.totalSets = { increment: 1 };
            if (quality === '+') updateData.setSuccess = { increment: 1 };
            if (quality === '-') updateData.setErrors = { increment: 1 };
            break;
        case 'RECEIVE':
            updateData.totalReceives = { increment: 1 };
            if (quality === '+') updateData.receiveSuccess = { increment: 1 };
            if (quality === '-') updateData.receiveErrors = { increment: 1 };
            break;
    }

    // Update match statistics
    await prismaClient.playerStatistics.update({
        where: { id: stats.id },
        data: updateData
    });

    // Update career statistics
    let careerStats = await prismaClient.playerStatistics.findFirst({
        where: {
            playerId,
            matchId: null
        }
    });

    if (!careerStats) {
        careerStats = await prismaClient.playerStatistics.create({
            data: {
                playerId,
                matchId: null
            }
        });
    }

    await prismaClient.playerStatistics.update({
        where: { id: careerStats.id },
        data: updateData
    });
}