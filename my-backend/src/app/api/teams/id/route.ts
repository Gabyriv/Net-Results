import { NextResponse } from "next/server";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { TeamUpdateSchema } from "../../types/types";
import prisma from "@/config/prisma";
import { withAuth } from "@/utils/auth-utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async () => {
        try {
            const team = await prisma.team.findUnique({
                where: { id: params.id },
                include: {
                    players: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            })
            
            if (!team) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 })
            }
            
            return NextResponse.json({ success: true, data: team }, { status: 200 })
        } catch (error) {
            return handleServerError(error)
        }
    })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (session) => {
        try {
            // Check if team exists and user has permission
            const existingTeam = await prisma.team.findUnique({
                where: { id: params.id },
                select: { createdById: true }
            })

            if (!existingTeam) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 })
            }

            // Only allow team creator or admin to update
            if (existingTeam.createdById !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to update this team' },
                    { status: 403 }
                )
            }

            const body = await request.json();
            const { name, players, games, wins, losses, draws } = TeamUpdateSchema.parse(body);
            
            const team = await prisma.team.update({
                where: { id: params.id },
                data: {
                    name,
                    players,
                    games,
                    wins,
                    losses,
                    draws,
                    updatedAt: new Date()
                },
                include: {
                    players: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            })
            
            return NextResponse.json({ success: true, data: team }, { status: 200 })
        } catch (error) {
            return handleServerError(error)
        }
    })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (session) => {
        try {
            // Check if team exists and user has permission
            const existingTeam = await prisma.team.findUnique({
                where: { id: params.id },
                select: { createdById: true }
            })

            if (!existingTeam) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 })
            }

            // Only allow team creator or admin to delete
            if (existingTeam.createdById !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to delete this team' },
                    { status: 403 }
                )
            }

            const team = await prisma.team.delete({
                where: { id: params.id }
            })
            
            return NextResponse.json({ success: true, data: team }, { status: 200 })
        } catch (error) {
            return handleServerError(error)
        }
    })
}
