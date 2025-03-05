import { NextResponse } from "next/server";
import { prismaClient } from "../../../../config/prisma-server";
import { handleServerError } from "../../errors_handlers/server-errors";
import { GameSchema } from "../../../../../types/types";


export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validate the input data using Zod schema
        const validationResult = GameSchema.safeParse(body);
        
        if (!validationResult.success) {
            return NextResponse.json(
                { success: false, error: validationResult.error.format() },
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
        
        // Create the game with the validated data
        // Only include fields that exist in the database
        const game = await prismaClient.game.create({
            data: {
                id: nextId,
                game: validationResult.data.game,
                myTeam: validationResult.data.myTeam,
                myPts: validationResult.data.myPts || 0,
                oppTeam: validationResult.data.oppTeam,
                oppPts: validationResult.data.oppPts || 0,
                sets: validationResult.data.sets,
                created_at: validationResult.data.created_at || new Date()
            }
        });

        return NextResponse.json(
            { success: true, data: game },
            { status: 201 }
        );
    } catch (error) {
        return handleServerError(error);
    }
} 