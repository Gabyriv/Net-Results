import { NextResponse } from "next/server";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { TeamUpdateSchema } from "../../types/types";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/utils/auth-utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    console.log('GET /api/teams/id - Starting request for ID:', params.id);
    
    return withAuth(request, async (session) => {
        console.log('GET /api/teams/id - Authenticated with session:', JSON.stringify(session));
        
        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid team ID' },
                    { status: 400 }
                );
            }
            
            const team = await prisma.team.findUnique({
                where: { id: params.id },
                include: {
                    players: true,
                    manager: {
                        select: {
                            id: true,
                            displayName: true,
                            userId: true
                        }
                    }
                }
            });
            
            if (!team) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            }
            
            return NextResponse.json({ success: true, data: team }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    console.log('PUT /api/teams/id - Starting request for ID:', params.id);
    
    return withAuth(request, async (session) => {
        console.log('PUT /api/teams/id - Authenticated with session:', JSON.stringify(session));
        
        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid team ID' },
                    { status: 400 }
                );
            }
            
            // Check if team exists and user has permission
            const existingTeam = await prisma.team.findUnique({
                where: { id: params.id },
                select: { 
                    id: true,
                    managerId: true 
                }
            });

            if (!existingTeam) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            }

            // Only allow team manager or a user with Manager role to update
            // First get the manager to check if the current user is the team's manager
            const manager = await prisma.manager.findUnique({
                where: { id: existingTeam.managerId },
                select: { userId: true }
            });
            
            if (!manager) {
                return NextResponse.json({ error: 'Team manager not found' }, { status: 404 });
            }
            
            if (manager.userId !== session.userId && session.userRole !== 'Manager') {
                console.log('PUT /api/teams/id - Access denied: Not team manager or Manager role');
                return NextResponse.json(
                    { error: 'You do not have permission to update this team' },
                    { status: 403 }
                );
            }

            try {
                const body = await request.json();
                const validated = TeamUpdateSchema.safeParse(body);
                
                if (!validated.success) {
                    return NextResponse.json(
                        { error: 'Invalid data format', details: validated.error.format() },
                        { status: 400 }
                    );
                }
                
                const team = await prisma.team.update({
                    where: { id: params.id },
                    data: {
                        ...(validated.data.name && { name: validated.data.name }),
                    },
                    include: {
                        players: true,
                        manager: {
                            select: {
                                id: true,
                                displayName: true,
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                        displayName: true,
                                    }
                                }
                            }
                        }
                    }
                });
                
                return NextResponse.json({ success: true, data: team }, { status: 200 });
            } catch (error) {
                return handleServerError(error);
            }
        } catch (error) {
            return handleServerError(error);
        }
    });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    console.log('DELETE /api/teams/id - Starting request for ID:', params.id);
    
    return withAuth(request, async (session) => {
        console.log('DELETE /api/teams/id - Authenticated with session:', JSON.stringify(session));
        
        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid team ID' },
                    { status: 400 }
                );
            }
            
            // Check if team exists and user has permission
            const existingTeam = await prisma.team.findUnique({
                where: { id: params.id },
                select: { managerId: true }
            });

            if (!existingTeam) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            }

            // Only allow team manager or a user with Manager role to delete
            // First get the manager to check if the current user is the team's manager
            const manager = await prisma.manager.findUnique({
                where: { id: existingTeam.managerId },
                select: { userId: true }
            });
            
            if (!manager) {
                return NextResponse.json({ error: 'Team manager not found' }, { status: 404 });
            }
            
            if (manager.userId !== session.userId && session.userRole !== 'Manager') {
                console.log('DELETE /api/teams/id - Access denied: Not team manager or Manager role');
                return NextResponse.json(
                    { error: 'You do not have permission to delete this team' },
                    { status: 403 }
                );
            }

            const team = await prisma.team.delete({
                where: { id: params.id }
            });
            
            return NextResponse.json({ success: true, data: team }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}
