import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { TeamSchema } from "../types/types";
import { withAuth } from "@/utils/auth-utils";

export async function POST(request: Request) {
    return withAuth(async (session) => {
        try {
            const body = await request.json();
            const { name } = TeamSchema.parse(body);

            const team = await prisma.team.create({
                data: {
                    name,
                    players: {
                        connect: []
                    },
                    createdBy: session.user.id // Track who created the team
                }
            })
            return NextResponse.json({ success: true, data: team }, { status: 201 })
        } catch (error) {
            return handleServerError(error)
        }
    })
}

export async function GET() {
    return withAuth(async () => {
        try {
            const teams = await prisma.team.findMany()
            return NextResponse.json({ success: true, data: teams }, { status: 200 })
        } catch (error) {
            return handleServerError(error)
        }
    })
}
