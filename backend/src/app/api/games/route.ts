import { NextResponse } from "next/server";
import { prisma } from "../../../config/prisma";
import { handleServerError } from "../errors_handlers/server-errors";
import { withAuth } from "../../../utils/auth-utils";
import { PrismaClient } from "@prisma/client";
import { GameSchema } from "../../../../types/types";

// Type assertion to help TypeScript recognize the models
const prismaClient = prisma as PrismaClient;


export async function POST(request: Request) {
    return withAuth(request, async (session) => {
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
            const game = await prismaClient.game.create({
                data: {
                    id: nextId,
                    game: validationResult.data.game,
                    myTeam: validationResult.data.myTeam,
                    myPts: validationResult.data.myPts,
                    oppTeam: validationResult.data.oppTeam,
                    oppPts: validationResult.data.oppPts,
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
    });
}


export async function GET(request: Request) {
    return withAuth(request, async () => {
        try {
            const games = await prismaClient.game.findMany({
                orderBy: [
                    { created_at: 'desc' }
                ]
            });

            return NextResponse.json({ success: true, data: games }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}
