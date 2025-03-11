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
    // Properly await the params
    const params = await Promise.resolve(context.params);
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
        console.error('Invalid game ID for GET request:', params.id);
        return NextResponse.json(
            { success: false, error: 'Invalid game ID' },
            { status: 400 }
        );
    }
    
    return withAuth(request, async () => {
        try {
            // Use the already validated and parsed id
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
    // Properly await the params
    const params = await Promise.resolve(context.params);
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
        console.error('Invalid game ID for PUT request:', params.id);
        return NextResponse.json(
            { success: false, error: 'Invalid game ID' },
            { status: 400 }
        );
    }
    
    return withAuth(request, async () => {
        try {
            // Use the already validated and parsed id
            // We no longer need to access context.params.id inside this callback
            const data = await request.json();
            console.log(`Received update for game ID: ${id} with data:`, JSON.stringify(data));
            
            // Create a clean data object for the update operation
            const updateData: Record<string, any> = {};
            
            // Ensure created_at is a Date object if provided
            if (data.created_at) {
                updateData.created_at = new Date(data.created_at);
            }
            
            // Handle JSON fields for Prisma - proper handling for setScores
            if (data.setScores !== undefined) {
                try {
                    if (typeof data.setScores === 'string') {
                        // If it's a string, parse it to an array/object
                        const parsed = JSON.parse(data.setScores);
                        
                        // Ensure that the parsed result is valid
                        if (Array.isArray(parsed)) {
                            updateData.setScores = parsed;
                            console.log('Successfully parsed setScores array:', parsed.length, 'sets');
                        } else if (typeof parsed === 'object') {
                            // If it's an object but not an array, keep it as is
                            updateData.setScores = parsed;
                            console.log('setScores parsed as an object type');
                        } else {
                            // Otherwise use a default empty object
                            console.error('Invalid setScores format, using default empty object');
                            updateData.setScores = {};
                        }
                    } else if (typeof data.setScores === 'object') {
                        // Already an object, leave as is
                        updateData.setScores = data.setScores;
                        console.log('setScores already an object type');
                    } else {
                        // Otherwise use a default empty object
                        console.error('Invalid setScores type, using default empty object');
                        updateData.setScores = {};
                    }
                } catch (e) {
                    console.error('Error parsing setScores, using default empty object:', e);
                    updateData.setScores = {};
                }
            }
            
            // Handle JSON fields for Prisma - proper handling for setsWon
            if (data.setsWon !== undefined) {
                try {
                    if (typeof data.setsWon === 'string') {
                        // If it's a string, parse it to an object
                        const parsed = JSON.parse(data.setsWon);
                        
                        // Ensure the parsed result is valid
                        if (typeof parsed === 'object') {
                            updateData.setsWon = parsed;
                            console.log('Successfully parsed setsWon object:', parsed);
                        } else {
                            // Otherwise use a default object
                            console.error('Invalid setsWon format, using default object');
                            updateData.setsWon = {home: 0, away: 0};
                        }
                    } else if (typeof data.setsWon === 'object') {
                        // Already an object, leave as is
                        updateData.setsWon = data.setsWon;
                        console.log('setsWon already an object type');
                    } else {
                        // Otherwise use a default object
                        console.error('Invalid setsWon type, using default object');
                        updateData.setsWon = {home: 0, away: 0};
                    }
                } catch (e) {
                    console.error('Error parsing setsWon, using default object:', e);
                    updateData.setsWon = {home: 0, away: 0};
                }
            }
            
            // Make sure numeric fields are proper numbers
            if (data.myPts !== undefined) updateData.myPts = Number(data.myPts);
            if (data.oppPts !== undefined) updateData.oppPts = Number(data.oppPts);
            if (data.currentSet !== undefined) updateData.currentSet = Number(data.currentSet);
            if (data.sets !== undefined) updateData.sets = Number(data.sets);
            
            // Copy other fields that don't need special processing
            if (data.game !== undefined) updateData.game = data.game;
            if (data.myTeam !== undefined) updateData.myTeam = data.myTeam;
            if (data.oppTeam !== undefined) updateData.oppTeam = data.oppTeam;
            if (data.notes !== undefined) {
                try {
                    if (typeof data.notes === 'string') {
                        updateData.notes = JSON.parse(data.notes);
                    } else if (typeof data.notes === 'object') {
                        updateData.notes = data.notes;
                    }
                } catch (e) {
                    updateData.notes = {};
                }
            }
            
            // Log the processed data before validation
            console.log('Processed data before update:', JSON.stringify({
                ...updateData,
                setScores: typeof updateData.setScores === 'object' ? 'object' : typeof updateData.setScores,
                setsWon: typeof updateData.setsWon === 'object' ? 'object' : typeof updateData.setsWon
            }));
            
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

            // Update the game with the processed data object
            const game = await prismaClient.game.update({
                where: { id },
                data: updateData
            });

            console.log('Successfully updated game:', id);
            return NextResponse.json({ success: true, data: game }, { status: 200 });
        } catch (error) {
            console.error('Database error in PUT /api/games/[id]:', error);
            // Fix the error handling to avoid source map issues
            return NextResponse.json(
                { 
                    success: false, 
                    error: "Database error", 
                    message: error instanceof Error ? error.message : String(error)
                },
                { status: 500 }
            );
        }
    });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
    // Properly await the params
    const params = await Promise.resolve(context.params);
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
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

            // Delete the game
            const game = await prismaClient.game.delete({
                where: { id }
            });

            return NextResponse.json({ success: true }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}
