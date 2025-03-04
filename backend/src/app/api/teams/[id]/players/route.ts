import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../config/prisma-server";
import { handleServerError } from "../../../errors_handlers/server-errors";
import { withAuth } from "../../../../../utils/auth-utils";
import { v4 as uuidv4 } from 'uuid';
import { Role } from "@prisma/client";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    return withAuth(request, async (session) => {
        try {
            // Await the params.id to avoid Next.js warning
            const teamId = await Promise.resolve(params.id);
            
            // Check if team exists
            const team = await prismaClient.team.findUnique({
                where: { id: teamId },
                include: { manager: true }
            });
            
            if (!team) {
                return NextResponse.json(
                    { error: 'Team not found' },
                    { status: 404 }
                );
            }
            
            // Get user from database to check role
            const dbUser = await prismaClient.user.findUnique({
                where: { id: session.userId },
                include: { manager: true }
            });
            
            if (!dbUser) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // Check if user is the team's manager
            if (dbUser.role !== 'Manager' || !dbUser.manager || team.managerId !== dbUser.manager.id) {
                return NextResponse.json(
                    { error: 'Only the team manager can add players to this team' },
                    { status: 403 }
                );
            }

            // Safely parse the request body
            let body;
            try {
                body = await request.json();
            } catch (error) {
                console.error('Error parsing request body:', error);
                return NextResponse.json(
                    { error: 'Invalid request body. Please provide valid JSON.' },
                    { status: 400 }
                );
            }

            // Set default values if body is null or undefined
            const { playerIds = [], newPlayers = [] } = body || {};
            
            // Validate newPlayers data
            interface PlayerData {
                name?: string;
                displayName?: string;
                number?: string | number;
                jerseyNumber?: string | number;
                [key: string]: any;
            }
            
            const validatedNewPlayers = newPlayers.filter((player: any) => {
                if (!player || typeof player !== 'object') {
                    console.warn('Invalid player data, not an object:', player);
                    return false;
                }
                
                // Log the player data to debug
                console.log('Processing player data:', JSON.stringify(player));
                
                // Check for either name or displayName
                if (!player.name && !player.displayName) {
                    console.warn('Invalid player data, missing name/displayName:', player);
                    return false;
                }
                
                // Ensure displayName is set
                if (!player.displayName && player.name) {
                    player.displayName = player.name;
                }
                
                // Handle number field (frontend might use 'number' instead of 'jerseyNumber')
                if (player.number && !player.jerseyNumber) {
                    player.jerseyNumber = player.number;
                }
                
                return true;
            }) as PlayerData[];
            
            // Connect existing players to the team
            if (playerIds.length > 0) {
                await prismaClient.player.updateMany({
                    where: {
                        id: { in: playerIds }
                    },
                    data: {
                        teamId
                    }
                });
            }
            
            // Create new players if provided
            const createdPlayers = [];
            if (validatedNewPlayers.length > 0) {
                for (const playerData of validatedNewPlayers) {
                    try {
                        // First create the user
                        const timestamp = Date.now();
                        const randomString = Math.random().toString(36).substring(2, 9);
                        const userId = `user_${timestamp}_${randomString}`;
                        
                        // Log the player data we're using
                        console.log('Creating player with data:', {
                            displayName: playerData.displayName,
                            number: playerData.number || playerData.jerseyNumber
                        });
                        
                        const user = await prismaClient.user.create({
                            data: {
                                id: userId,
                                email: `player-${timestamp}@example.com`,
                                password: Math.random().toString(36).substring(2, 15), // Random password
                                displayName: playerData.displayName || 'Player', // Provide default value
                                role: 'Player'
                            }
                        });

                        // Then create the player linked to the user
                        const newPlayer = await prismaClient.player.create({
                            data: {
                                id: `player_${timestamp}_${randomString}`,
                                displayName: playerData.displayName || 'Player', // Provide default value
                                gamesPlayed: 0,
                                number: playerData.number ? parseInt(String(playerData.number)) : 
                                        playerData.jerseyNumber ? parseInt(String(playerData.jerseyNumber)) : null,
                                teamId: teamId,
                                userId: user.id
                            }
                        });
                        
                        createdPlayers.push(newPlayer);
                        console.log(`Created player: ${newPlayer.id} for team: ${teamId}`);
                    } catch (error) {
                        console.error('Error creating player:', error);
                    }
                }
            }
            
            // Get updated team with all players
            const updatedTeam = await prismaClient.team.findUnique({
                where: { id: teamId },
                include: {
                    players: true,
                    manager: {
                        select: {
                            displayName: true
                        }
                    }
                }
            });

            return NextResponse.json({
                success: true,
                data: updatedTeam,
                addedPlayers: {
                    existing: playerIds.length,
                    new: createdPlayers.length
                }
            }, { status: 200 });
        } catch (error) {
            console.error('Error in player creation:', error);
            return handleServerError(error);
        }
    });
}