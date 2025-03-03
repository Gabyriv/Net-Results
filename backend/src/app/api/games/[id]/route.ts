import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/server-errors";
import { GameUpdateSchema } from "../../types/types";
import { withAuth } from "@/utils/auth-utils";
import { PrismaClient } from "@prisma/client";

// Type assertion to help TypeScript recognize the models
const prismaClient = prisma as PrismaClient;

export async function GET(request: Request, { params }: { params: { id: string } }) {
    return withAuth(request, async () => {
        try {
            const id = parseInt(params.id);
            if (isNaN(id)) {
                return NextResponse.json(
                    { error: 'Invalid game ID' },
                    { status: 400 }
                );
            }

            const game = await prismaClient.game.findUnique({
                where: { id }
            });

            if (!game) {
                return NextResponse.json(
                    { error: 'Game not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: game }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}


export async function PUT(request: Request, { params }: { params: { id: string } }) {
    return withAuth(request, async () => {
        try {
            const id = parseInt(params.id);
            if (isNaN(id)) {
                return NextResponse.json(
                    { error: 'Invalid game ID' },
                    { status: 400 }
                );
            }

            const body = await request.json();
            
            // Ensure created_at is a Date object if provided
            if (body.created_at) {
                body.created_at = new Date(body.created_at);
            }
            
            const validated = GameUpdateSchema.parse(body);

            // Check if game exists
            const gameExists = await prismaClient.game.findUnique({
                where: { id }
            });

            if (!gameExists) {
                return NextResponse.json(
                    { error: 'Game not found' },
                    { status: 404 }
                );
            }

            // Update the game
            const game = await prismaClient.game.update({
                where: { id },
                data: validated
            });

            return NextResponse.json({ success: true, data: game }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    return withAuth(request, async () => {
        try {
            const id = parseInt(params.id);
            if (isNaN(id)) {
                return NextResponse.json(
                    { error: 'Invalid game ID' },
                    { status: 400 }
                );
            }

            // Check if game exists
            const gameExists = await prismaClient.game.findUnique({
                where: { id }
            });

            if (!gameExists) {
                return NextResponse.json(
                    { error: 'Game not found' },
                    { status: 404 }
                );
            }

            // Delete the game
            await prismaClient.game.delete({
                where: { id }
            });

            return NextResponse.json({ success: true }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}
