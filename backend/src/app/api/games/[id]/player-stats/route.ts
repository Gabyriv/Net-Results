import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a single PrismaClient instance for the whole app
const prisma = new PrismaClient();

// Define the StatType enum to match what's in schema.prisma
enum StatType {
  SERVE = 'SERVE',
  PASS = 'PASS',
  SET = 'SET',
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  DIG = 'DIG'
}

// GET /api/games/[id]/player-stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = parseInt(params.id, 10);
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    // Get player stats for the specified game using raw SQL query
    const playerStats = await prisma.$queryRaw`
      SELECT ps.*, p."displayName"
      FROM "PlayerStat" ps
      JOIN "Player" p ON ps."playerId" = p.id
      WHERE ps."gameId" = ${gameId}
    `;
    
    return NextResponse.json({ success: true, data: playerStats });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Error fetching player stats' },
      { status: 500 }
    );
  }
}

// POST /api/games/[id]/player-stats
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse request body
    const body = await request.json();
    const { playerId, statType, value } = body;
    
    // Input validation
    if (!playerId || !statType || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate stat type
    if (!Object.values(StatType).includes(statType as StatType)) {
      return NextResponse.json({ error: 'Invalid stat type' }, { status: 400 });
    }
    
    const gameId = parseInt(params.id, 10);
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }
    
    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    });
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    // Get or create stat ID for this type
    const stat = await prisma.$queryRaw`
      SELECT * FROM "Stat" WHERE name = ${statType} LIMIT 1
    `;
    
    let statId;
    
    if (Array.isArray(stat) && stat.length > 0) {
      statId = stat[0].id;
    } else {
      // Create new stat type if it doesn't exist
      const newStatId = Date.now(); // Generate a unique ID
      await prisma.$executeRaw`
        INSERT INTO "Stat" (id, name) VALUES (${newStatId}, ${statType})
      `;
      statId = newStatId;
    }
    
    // Get the current date for dayOfGame
    const today = new Date().toISOString().split('T')[0];
    
    // Check if the stat already exists
    const existingStat = await prisma.$queryRaw`
      SELECT * FROM "PlayerStat" 
      WHERE "playerId" = ${playerId} 
      AND "gameId" = ${gameId} 
      AND "statId" = ${statId}
      LIMIT 1
    `;
    
    let result;
    
    if (Array.isArray(existingStat) && existingStat.length > 0) {
      // Update existing stat
      await prisma.$executeRaw`
        UPDATE "PlayerStat"
        SET value = ${value}
        WHERE id = ${existingStat[0].id}
      `;
      
      result = {
        ...existingStat[0],
        value
      };
    } else {
      // Create new stat
      const uuid = await prisma.$queryRaw`SELECT uuid_generate_v4()`;
      const newId = Array.isArray(uuid) ? uuid[0].uuid_generate_v4 : undefined;
      
      await prisma.$executeRaw`
        INSERT INTO "PlayerStat" (
          id, value, created_at, dayOfGame, playerId, statId, gameId, statType
        ) VALUES (
          ${newId || 'uuid_generate_v4()'},
          ${value},
          CURRENT_TIMESTAMP,
          ${today},
          ${playerId},
          ${statId},
          ${gameId},
          ${statType}::text::"StatType"
        )
      `;
      
      result = {
        id: newId,
        value,
        playerId,
        statId,
        gameId,
        statType,
        dayOfGame: today,
        created_at: new Date()
      };
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error submitting player stat:', error);
    return NextResponse.json(
      { error: 'Error submitting player stat' },
      { status: 500 }
    );
  }
}

// DELETE /api/games/[id]/player-stats
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');
    const statType = searchParams.get('statType');
    
    // Input validation
    if (!playerId || !statType) {
      return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
    }

    // Validate stat type
    if (!Object.values(StatType).includes(statType as StatType)) {
      return NextResponse.json({ error: 'Invalid stat type' }, { status: 400 });
    }
    
    const gameId = parseInt(params.id, 10);
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }
    
    // Get stat ID for this type
    const stat = await prisma.$queryRaw`
      SELECT * FROM "Stat" WHERE name = ${statType} LIMIT 1
    `;
    
    if (!Array.isArray(stat) || stat.length === 0) {
      return NextResponse.json({ error: 'Stat type not found' }, { status: 404 });
    }
    
    const statId = stat[0].id;
    
    // Check if the stat exists
    const existingStat = await prisma.$queryRaw`
      SELECT * FROM "PlayerStat" 
      WHERE "playerId" = ${playerId} 
      AND "gameId" = ${gameId} 
      AND "statId" = ${statId}
      LIMIT 1
    `;
    
    if (!Array.isArray(existingStat) || existingStat.length === 0) {
      return NextResponse.json({ error: 'Stat not found' }, { status: 404 });
    }
    
    // Delete the player stat
    await prisma.$executeRaw`
      DELETE FROM "PlayerStat"
      WHERE id = ${existingStat[0].id}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting player stat:', error);
    return NextResponse.json(
      { error: 'Error deleting player stat' },
      { status: 500 }
    );
  }
} 