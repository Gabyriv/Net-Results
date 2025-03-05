import { NextResponse } from "next/server";
import { prismaClient } from "../../../../config/prisma-server";
import { handleServerError } from "../../errors_handlers/server-errors";
import { withAuth } from "../../../../utils/auth-utils";
import { Role } from "@prisma/client";

// Define session type for consistency
type SessionType = {
    userId: string;
    userEmail: string;
    userRole: string;
    userMetadata: Record<string, unknown>;
};

/**
 * Get a specific player by ID
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (session: SessionType) => {
        try {
            // Await the params object to get id
            const { id } = await params;

            if (!id) {
                return NextResponse.json(
                    { error: 'Invalid player ID' },
                    { status: 400 }
                );
            }

            // Fetch the player with related data
            const player = await prismaClient.player.findUnique({
                where: { id },
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

            // Check permissions
            const isManager = session.userRole === 'Manager';
            const isTeamManager = player.team && player.team.managerId === session.userId;
            const isPlayer = player.userId === session.userId;

            if (!isManager && !isTeamManager && !isPlayer) {
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
 * Update a player by ID
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (session: SessionType) => {
        try {
            console.log('PUT player handler started')
            
            // Await the params object to get id
            const { id } = await params;
            console.log('Player ID:', id)

            if (!id) {
                return NextResponse.json(
                    { error: 'Invalid player ID' },
                    { status: 400 }
                );
            }

            // Get current player and team info
            const currentPlayer = await prismaClient.player.findUnique({
                where: { id },
                include: {
                    team: {
                        select: {
                            id: true,
                            managerId: true
                        }
                    }
                }
            });
            console.log('Current player:', currentPlayer)

            if (!currentPlayer) {
                return NextResponse.json(
                    { error: 'Player not found' },
                    { status: 404 }
                );
            }

            // Check permissions
            const isManager = session.userRole === 'Manager';
            const isTeamManager = currentPlayer.team && currentPlayer.team.managerId === session.userId;
            console.log('Permissions check - isManager:', isManager, 'isTeamManager:', isTeamManager)

            if (!isManager && !isTeamManager) {
                return NextResponse.json(
                    { error: 'You do not have permission to update this player' },
                    { status: 403 }
                );
            }

            // Validate and process request body
            const body = await request.json();
            console.log('Request body:', body)
            
            // Basic validation
            if (body.displayName && typeof body.displayName !== 'string') {
                return NextResponse.json(
                    { error: 'Display name must be a string' },
                    { status: 400 }
                );
            }
            
            if (body.number !== undefined && isNaN(Number(body.number))) {
                return NextResponse.json(
                    { error: 'Number must be a valid number' },
                    { status: 400 }
                );
            }

            // If changing teams, verify the new team exists and user has permission
            if (body.teamId && body.teamId !== currentPlayer.teamId) {
                console.log('Team change detected - from:', currentPlayer.teamId, 'to:', body.teamId)
                const newTeam = await prismaClient.team.findUnique({
                    where: { id: body.teamId },
                    select: { managerId: true }
                });

                if (!newTeam) {
                    return NextResponse.json(
                        { error: 'New team not found' },
                        { status: 404 }
                    );
                }

                // Only allow if user is Manager or creator of the team
                if (!isManager && newTeam.managerId !== session.userId) {
                    return NextResponse.json(
                        { error: 'You do not have permission to move this player to the specified team' },
                        { status: 403 }
                    );
                }
            }

            // Prepare update data
            const updateData = {
                ...(body.displayName && { displayName: body.displayName }),
                ...(body.jerseyNumber !== undefined ? { 
                    number: parseInt(body.jerseyNumber.toString()) 
                } : body.number !== undefined ? { 
                    number: parseInt(body.number.toString()) 
                } : {}),
                ...(body.teamId !== undefined && { teamId: body.teamId })
            };
            console.log('Update data:', updateData)

            // Update the player
            const player = await prismaClient.player.update({
                where: { id },
                data: updateData,
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
            console.log('Updated player:', player)

            return NextResponse.json({ success: true, data: player }, { status: 200 });
        } catch (error) {
            console.error('Error updating player:', error);
            return handleServerError(error);
        }
    });
}

/**
 * Delete a player by ID
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (session: SessionType) => {
        try {
            console.log('DELETE player handler started')
            
            // Await the params object to get id
            const { id } = await params;
            console.log('Player ID to delete:', id)

            if (!id) {
                return NextResponse.json(
                    { error: 'Invalid player ID' },
                    { status: 400 }
                );
            }

            // Get the player to check permissions
            const player = await prismaClient.player.findUnique({
                where: { id },
                include: {
                    team: {
                        select: {
                            managerId: true
                        }
                    }
                }
            });
            console.log('Player to delete:', player)

            if (!player) {
                return NextResponse.json(
                    { error: 'Player not found' },
                    { status: 404 }
                );
            }

            // Check permissions
            const isManager = session.userRole === 'Manager';
            const isTeamManager = player.team && player.team.managerId === session.userId;
            console.log('Permissions check - isManager:', isManager, 'isTeamManager:', isTeamManager)

            if (!isManager && !isTeamManager) {
                return NextResponse.json(
                    { error: 'You do not have permission to delete this player' },
                    { status: 403 }
                );
            }

            // Delete the player
            await prismaClient.player.delete({
                where: { id }
            });
            console.log('Player deleted successfully')

            return NextResponse.json({ success: true, message: 'Player deleted successfully' }, { status: 200 });
        } catch (error) {
            console.error('Error deleting player:', error);
            return handleServerError(error);
        }
    });
} 