import { NextResponse } from "next/server";
import { prismaClient } from "../../../../config/prisma-server";
import { handleServerError } from "../../errors_handlers/server-errors";


export async function GET(request: Request) {
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
} 