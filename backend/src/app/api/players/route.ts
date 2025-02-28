import { NextResponse } from "next/server";
import { prisma } from "../../../config/prisma";
import { handleServerError } from "../errors_handlers/errors";
import { PlayerSchema } from "../types/types";
import { withAuth } from "../../../utils/auth-utils";
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

/**
 * @swagger
 * /api/players:
 *   post:
 *     summary: Create a new player
 *     description: Creates a new player for a team
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *               - teamId
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               teamId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               gamesPlayed:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Player created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager access required
 *       404:
 *         description: Team not found
 */
export async function POST(request: Request) {
    console.log('POST /api/players - Starting request');
    
    return withAuth(request, async (session) => {
        console.log('POST /api/players - Authenticated with session:', JSON.stringify(session));
        
        // Check if user has Manager role
        if (session.userRole !== 'Manager') {
            console.log('POST /api/players - Access denied: User role is not Manager');
            return NextResponse.json({ 
                error: 'Forbidden', 
                message: 'Only managers can create players' 
            }, { status: 403 });
        }
        
        try {
            const body = await request.json();
            console.log('POST /api/players - Request body:', JSON.stringify(body));
            
            // Handle case differences in field names (teamID vs teamId)
            const normalizedBody = {
                ...body,
                teamId: body.teamId || body.teamID // Accept both teamId and teamID
            };
            
            // Validate the request body
            const validated = PlayerSchema.safeParse(normalizedBody);
            if (!validated.success) {
                return NextResponse.json({ 
                    error: 'Invalid input', 
                    details: validated.error.format() 
                }, { status: 400 });
            }
            
            // Check if the team exists
            const team = await prisma.team.findUnique({
                where: { id: validated.data.teamId }
            });
            
            if (!team) {
                return NextResponse.json({ 
                    error: 'Team not found', 
                    message: `No team found with ID: ${validated.data.teamId}` 
                }, { status: 404 });
            }
            
            // Create the player base data
            const playerData: Omit<Prisma.PlayerCreateInput, 'user'> = {
                id: uuidv4(), // Generate a UUID for the player ID
                displayName: validated.data.displayName,
                gamesPlayed: validated.data.gamesPlayed || 0,
                team: {
                    connect: { id: validated.data.teamId }
                }
            };
            
            // Complete player data with user relationship
            let completePlayerData: Prisma.PlayerCreateInput;
            
            // If userId is provided, connect to existing user
            if (validated.data.userId) {
                completePlayerData = {
                    ...playerData,
                    user: {
                        connect: { id: validated.data.userId }
                    }
                };
            } else {
                // Create a new user for this player
                const newUserId = uuidv4();
                completePlayerData = {
                    ...playerData,
                    user: {
                        create: {
                            id: newUserId,
                            email: `player-${newUserId.substring(0, 8)}@example.com`,
                            password: "defaultPassword", // This should be hashed in production
                            displayName: validated.data.displayName,
                            role: "Player"
                        }
                    }
                };
            }
            
            console.log('Creating player with data:', JSON.stringify(completePlayerData, null, 2));
            
            const player = await prisma.player.create({
                data: completePlayerData,
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            displayName: true,
                            role: true
                        }
                    }
                }
            });
            
            return NextResponse.json({ success: true, data: player }, { status: 201 });
        } catch (dbError) {
            console.error('Database error creating player:', dbError);
            return NextResponse.json({ 
                error: 'Database error', 
                message: dbError instanceof Error ? dbError.message : String(dbError)
            }, { status: 500 });
        }
    }, 'Manager'); // Explicitly require Manager role
}

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Get all players
 *     description: Retrieves a list of all players
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of players retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager access required
 */
export async function GET(request: Request) {
    console.log('GET /api/players - Starting request');
    
    return withAuth(request, async (session) => {
        console.log('GET /api/players - Authenticated with session:', JSON.stringify(session));
        
        // Check if user has Manager role
        if (session.userRole !== 'Manager') {
            console.log('GET /api/players - Access denied: User role is not Manager');
            return NextResponse.json({ 
                error: 'Forbidden', 
                message: 'Only managers can access the list of all players' 
            }, { status: 403 });
        }
        
        try {
            const players = await prisma.player.findMany({
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            displayName: true,
                            role: true
                        }
                    }
                }
            });
            
            return NextResponse.json({ success: true, data: players });
        } catch (error) {
            return handleServerError(error);
        }
    }, 'Manager'); // Explicitly require Manager role
}
