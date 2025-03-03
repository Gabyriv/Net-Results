import { NextResponse } from "next/server";
import { prisma } from "../../../config/prisma";
import { handleServerError } from "../errors_handlers/errors";
import { TeamSchema } from "../types/types";
import { withAuth } from "../../../utils/auth-utils";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    console.log('POST /api/teams - Starting request');
    
    return withAuth(request, async (session) => {
        console.log('POST /api/teams - Authenticated with session:', JSON.stringify(session));
        
        try {
            // Only Managers can create teams
            if (session.userRole !== 'Manager') {
                console.log('POST /api/teams - Access denied: Not a Manager role');
                return NextResponse.json(
                    { error: 'Forbidden - Manager access required' },
                    { status: 403 }
                );
            }

            const body = await request.json();
            console.log('Team creation request body:', body);
            const validated = TeamSchema.safeParse(body);
            
            if (!validated.success) {
                console.log('Team validation error:', validated.error);
                return NextResponse.json(
                    { 
                        error: 'Invalid data format', 
                        details: validated.error.format(), 
                        receivedBody: body,
                        bodyType: typeof body,
                        isObject: body !== null && typeof body === 'object',
                        hasNameProperty: body !== null && typeof body === 'object' && 'name' in body,
                        namePropertyType: body !== null && typeof body === 'object' && 'name' in body ? typeof body.name : 'not present'
                    },
                    { status: 400 }
                );
            }

            try {
                // First, get the manager record for the current user
                const manager = await prisma.manager.findUnique({
                    where: { userId: session.userId }
                });

                if (!manager) {
                    return NextResponse.json(
                        { error: 'Manager record not found for this user' },
                        { status: 404 }
                    );
                }

                // Now create the team with the correct manager relationship
                const team = await prisma.team.create({
                    data: {
                        id: uuidv4(), // Generate a UUID for the team ID
                        name: validated.data.name,
                        manager: {
                            connect: { id: manager.id }
                        }
                    }
                });
                
                return NextResponse.json({ success: true, data: team }, { status: 201 });
            } catch (dbError) {
                console.error('Database error creating team:', dbError);
                return NextResponse.json({ 
                    error: 'Database error', 
                    message: dbError instanceof Error ? dbError.message : String(dbError)
                }, { status: 500 });
            }
        } catch (error) {
            return handleServerError(error);
        }
    });
}

export async function GET(request: Request) {
    console.log('GET /api/teams - Starting request');
    
    return withAuth(request, async (session) => {
        console.log('GET /api/teams - Authenticated with session:', JSON.stringify(session));
        
        try {
            // Anyone can view teams, but we might want to filter based on role
            const teams = await prisma.team.findMany();
            return NextResponse.json({ success: true, data: teams }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}
