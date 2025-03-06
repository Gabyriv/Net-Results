import { NextResponse } from "next/server";
import { prismaClient } from "../../../../config/prisma-server";
import { GameSchema } from "../../../../../types/types";


export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Received game data:", JSON.stringify({
            game: body.game,
            myTeam: body.myTeam,
            oppTeam: body.oppTeam,
            sets: body.sets,
            servingTeam: body.servingTeam
        }));
        
        // Validate the input data using Zod schema
        const validationResult = GameSchema.safeParse(body);
        
        if (!validationResult.success) {
            console.log("Validation error in game creation");
            
            return NextResponse.json(
                { success: false, error: "Validation failed", details: validationResult.error.format() },
                { status: 400 }
            );
        }
        
        // Get the next available ID
        const lastGame = await prismaClient.game.findFirst({
            orderBy: {
                id: 'desc'
            }
        });
        
        const nextId = lastGame ? lastGame.id + 1 : 1;
        
        // Create game data object - note servingTeam will use the default value from the schema
        const gameData = {
            id: nextId,
            game: validationResult.data.game,
            myTeam: validationResult.data.myTeam,
            myPts: validationResult.data.myPts || 0,
            oppTeam: validationResult.data.oppTeam,
            oppPts: validationResult.data.oppPts || 0,
            sets: validationResult.data.sets,
            created_at: validationResult.data.created_at || new Date(),
            setScores: validationResult.data.setScores ? JSON.parse(validationResult.data.setScores) : {},
            setsWon: validationResult.data.setsWon ? JSON.parse(validationResult.data.setsWon) : {"home":0,"away":0},
            currentSet: validationResult.data.currentSet || 1,
            isActive: validationResult.data.isActive !== undefined ? validationResult.data.isActive : true
            // servingTeam is intentionally omitted to use the default from the schema
        };
        
        // Create the game with the validated data
        const game = await prismaClient.game.create({
            data: gameData
        });

        return NextResponse.json(
            { success: true, data: game },
            { status: 201 }
        );
    } catch (error) {
        // Safe error handling without direct error object logging
        let errorMessage = 'Unknown error creating game';
        let statusCode = 500;
        let errorDetails = {};
        
        // Safe extraction of error information
        if (error instanceof Error) {
            errorMessage = error.message;
            
            // Log only the error message, not the full error object
            console.log(`Error in game creation: ${errorMessage}`);
            
            // Check for Prisma-specific errors
            if (error.name === 'PrismaClientKnownRequestError') {
                statusCode = 400;
                errorDetails = { code: 'database_error' };
            } else if (error.name === 'PrismaClientValidationError') {
                statusCode = 400;
                errorDetails = { code: 'validation_error' };
            }
        } else {
            console.log('Unknown error type in game creation');
        }
        
        return NextResponse.json(
            { 
                success: false, 
                error: errorMessage,
                details: errorDetails
            },
            { status: statusCode }
        );
    }
} 