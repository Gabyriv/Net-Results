import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatType } from '@prisma/client';

// Create a single PrismaClient instance for the whole app
const prisma = new PrismaClient();

// GET /api/games/[id]/player-stats
export async function GET(request: Request, context: { params: { id: string } }) {
  const params = await Promise.resolve(context.params);
  const gameId = params.id;
  
  if (!gameId) {
    return NextResponse.json(
      { success: false, error: 'Invalid game ID' }, 
      { status: 400 }
    );
  }

  try {
    // Get player stats for the specified game using Prisma client
    const playerStats = await prisma.playerStats.findMany({
      where: {
        gameId: gameId
      },
      include: {
        Player: {
          select: {
            displayName: true
          }
        }
      }
    });
    
    return NextResponse.json({ success: true, data: playerStats });
  } catch (error) {
    // Safely log error without directly passing potentially null object
    console.error('Error fetching player stats:', error ? error.toString() : 'Unknown error');
    
    // Create a safe error response object
    const safeErrorObj = {
      error: 'Error fetching player stats',
      message: error instanceof Error ? error.message : String(error || 'Unknown error')
    };
    
    // Return a safe error response
    return NextResponse.json(safeErrorObj, { status: 500 });
  }
}

// POST /api/games/[id]/player-stats
export async function POST(request: Request, context: { params: { id: string } }) {
  const params = await Promise.resolve(context.params);
  const gameId = params.id;
  
  if (!gameId) {
    return NextResponse.json(
      { success: false, error: 'Invalid game ID' },
      { status: 400 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const { playerId, statType, value } = body;
    
    // Log the received data for debugging
    console.log('Received player stat:', { playerId, statType, value, gameId });
    
    // Input validation
    if (!playerId || !statType || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields', received: { playerId, statType, value } }, 
        { status: 400 }
      );
    }
    
    // Validate stat type
    if (!Object.values(StatType).includes(statType as StatType)) {
      return NextResponse.json(
        { 
          error: 'Invalid stat type', 
          received: statType, 
          validTypes: Object.values(StatType)
        }, 
        { status: 400 }
      );
    }
    
    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found', gameId }, { status: 404 });
    }
    
    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    });
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found', playerId }, { status: 404 });
    }

    // Get the player's team ID
    const teamId = player.teamId;
    
    if (!teamId) {
      return NextResponse.json({ error: 'Player is not assigned to a team', playerId }, { status: 400 });
    }
    
    try {
      // Generate a unique ID for the stat
      const uuid = await prisma.$queryRaw`SELECT uuid_generate_v4()`;
      const newId = Array.isArray(uuid) && uuid.length > 0 && uuid[0].uuid_generate_v4 
        ? uuid[0].uuid_generate_v4 
        : null;
      
      // If we couldn't generate UUID, return error
      if (!newId) {
        return NextResponse.json({ error: 'Failed to generate unique ID for player stat' }, { status: 500 });
      }
      
      // Create new PlayerStats record
      const result = await prisma.playerStats.create({
        data: {
          id: newId,
          playerId: playerId,
          gameId: gameId,
          teamId: teamId,
          statType: statType as StatType,
          value: Number(value),
          quality: value.toString(), // Using value as quality since it's required
          updatedAt: new Date()
        }
      });
      
      return NextResponse.json({ success: true, data: result });
    } catch (dbError) {
      console.error('Database operation error:', dbError ? dbError.toString() : 'Unknown error');
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : String(dbError || 'Unknown error')
      }, { status: 500 });
    }
  } catch (error) {
    // Safely log error without directly passing potentially null object
    console.error('Error submitting player stat:', error ? error.toString() : 'Unknown error');
    
    // Create a safe error response object with proper typing
    const safeErrorObj: {
      error: string;
      message: string;
      stack?: string;
    } = {
      error: 'Error submitting player stat',
      message: error instanceof Error ? error.message : String(error || 'Unknown error')
    };
    
    // Only include stack trace in development
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      safeErrorObj.stack = error.stack;
    }
    
    // Safely handle the NextResponse.json call with proper parameters
    return NextResponse.json(safeErrorObj, { status: 500 });
  }
}

// DELETE /api/games/[id]/player-stats
export async function DELETE(request: Request, context: { params: { id: string } }) {
  const params = await Promise.resolve(context.params);
  const gameId = params.id;
  
  if (!gameId) {
    return NextResponse.json(
      { success: false, error: 'Invalid game ID' },
      { status: 400 }
    );
  }

  try {
    const url = new URL(request.url);
    const statType = url.searchParams.get('statType');
    const playerId = url.searchParams.get('playerId');

    if (!statType || !playerId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate stat type
    if (!Object.values(StatType).includes(statType as StatType)) {
      return NextResponse.json(
        { error: 'Invalid stat type' },
        { status: 400 }
      );
    }
    
    // Delete player stats directly from PlayerStats table
    await prisma.playerStats.deleteMany({
      where: {
        gameId,
        playerId,
        statType: statType as StatType
      }
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    // Safely log error without directly passing potentially null object
    console.error('Error deleting player stats:', error ? error.toString() : 'Unknown error');
    
    // Create a safe error response object with proper typing
    const safeErrorObj = {
      error: 'Error deleting player stats',
      message: error instanceof Error ? error.message : String(error || 'Unknown error')
    };
    
    // Return a safe error response
    return NextResponse.json(safeErrorObj, { status: 500 });
  }
} 