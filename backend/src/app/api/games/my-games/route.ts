import { NextResponse } from "next/server";
import { prismaClient } from "../../../../config/prisma-server";
import { handleServerError } from "../../errors_handlers/server-errors";
import { withAuth } from "../../../../utils/auth-utils";

export async function GET(request: Request) {
    return withAuth(request, async ({ userId }) => {
        try {
            // Filter games by the authenticated user's ID
            const games = await prismaClient.game.findMany({
                where: {
                    userId: userId
                },
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