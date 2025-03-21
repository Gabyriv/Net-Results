import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/server-errors";
import { withAuth } from "@/utils/auth-utils";
import { PrismaClient } from "@prisma/client";

// Import the GameSchema directly rather than using the wrong path
import { GameSchema, GameUpdateSchema } from "../../../../../types/types";

// Type assertion to help TypeScript recognize the models
const prismaClient = prisma as PrismaClient;

export async function GET(request: Request, context: { params: { id: string } }) {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    
    if (!id) {
        console.error('Invalid game ID for GET request:', params.id);
        return NextResponse.json(
            { success: false, error: 'Invalid game ID' },
            { status: 400 }
        );
    }
    
    return withAuth(request, async () => {
        try {
            const game = await prismaClient.game.findUnique({
                where: { id }
            });

            if (!game) {
                console.log('Game not found for ID:', id);
                return NextResponse.json(
                    { success: false, error: 'Game not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: game }, { status: 200 });
        } catch (error) {
            console.error('Error in GET /api/games/[id]:', error);
            return handleServerError(error);
        }
    });
}

export async function PUT(request: Request, context: { params: { id: string } }) {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    
    if (!id) {
        console.error('Invalid game ID for PUT request:', params.id);
        return NextResponse.json(
            { success: false, error: 'Invalid game ID' },
            { status: 400 }
        );
    }
    
    return withAuth(request, async () => {
        try {
            const data = await request.json();
            console.log(`Received update for game ID: ${id} with data:`, JSON.stringify(data));
            
            // Create a clean data object for the update operation
            const updateData: Record<string, any> = {};
            
            // Handle created_at
            if (data.created_at) {
                updateData.created_at = new Date(data.created_at);
            }
            
            // Handle JSON fields
            if (data.setScores !== undefined) {
                const setScores = typeof data.setScores === 'string' 
                    ? JSON.parse(data.setScores)
                    : data.setScores;
                updateData.setScores = JSON.stringify(setScores);
                
                // Calculate total points from set scores
                let myTotalPts = 0;
                let oppTotalPts = 0;
                Object.values(setScores).forEach((set: any) => {
                    if (set && !set.inProgress) {
                        myTotalPts += Number(set.homeScore || 0);
                        oppTotalPts += Number(set.awayScore || 0);
                    }
                });
                updateData.myPts = myTotalPts;
                updateData.oppPts = oppTotalPts;
            }
            
            if (data.setsWon !== undefined) {
                const setsWon = typeof data.setsWon === 'string'
                    ? JSON.parse(data.setsWon)
                    : data.setsWon;
                updateData.setsWon = JSON.stringify(setsWon);
                
                // Update game status based on sets won
                const homeSets = Number(setsWon.home || 0);
                const awaySets = Number(setsWon.away || 0);
                const maxSets = data.maxSets || 3;
                
                // Game is inactive if either team has won more than half of max sets
                if (homeSets > maxSets / 2 || awaySets > maxSets / 2) {
                    updateData.isActive = false;
                }
            }
            
            // Handle numeric fields
            if (data.currentSet !== undefined) updateData.currentSet = Number(data.currentSet);
            if (data.sets !== undefined) updateData.sets = Number(data.sets);
            if (data.maxSets !== undefined) updateData.maxSets = Number(data.maxSets);
            
            // Handle other fields
            if (data.game !== undefined) updateData.game = data.game;
            if (data.myTeam !== undefined) updateData.myTeam = data.myTeam;
            if (data.oppTeam !== undefined) updateData.oppTeam = data.oppTeam;
            if (data.servingTeam !== undefined) updateData.servingTeam = data.servingTeam;
            
            // Check if game exists
            const gameExists = await prismaClient.game.findUnique({
                where: { id }
            });

            if (!gameExists) {
                return NextResponse.json(
                    { success: false, error: 'Game not found' },
                    { status: 404 }
                );
            }

            console.log('Updating game with data:', updateData);

            // Update the game with the processed data object
            const game = await prismaClient.game.update({
                where: { id },
                data: updateData
            });

            return NextResponse.json({ success: true, data: game }, { status: 200 });
        } catch (error) {
            console.error('Error in PUT /api/games/[id]:', error instanceof Error ? error.message : 'Unknown error');
            return NextResponse.json(
                { 
                    success: false, 
                    error: "Failed to update game",
                    message: error instanceof Error ? error.message : String(error)
                },
                { status: 500 }
            );
        }
    });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    
    if (!id) {
        console.error('Invalid game ID for DELETE request:', params.id);
        return NextResponse.json(
            { success: false, error: 'Invalid game ID' },
            { status: 400 }
        );
    }
    
    return withAuth(request, async () => {
        try {
            // Check if game exists
            const gameExists = await prismaClient.game.findUnique({
                where: { id }
            });

            if (!gameExists) {
                return NextResponse.json(
                    { success: false, error: 'Game not found' },
                    { status: 404 }
                );
            }

            // First, delete associated player stats to avoid foreign key constraint errors
            await prismaClient.playerStats.deleteMany({
                where: { gameId: id }
            });
            
            console.log(`Deleted all player stats for game ${id}`);

            // Then delete the game
            const game = await prismaClient.game.delete({
                where: { id }
            });

            return NextResponse.json({ success: true }, { status: 200 });
        } catch (error) {
            console.error(`Error deleting game ${id}:`, error);
            return NextResponse.json(
                { 
                    success: false, 
                    error: "Database error", 
                    details: error instanceof Error ? error.message : String(error)
                }, 
                { status: 400 }
            );
        }
    });
}
