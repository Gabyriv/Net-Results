import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a single PrismaClient instance
const prisma = new PrismaClient();

// GET /api/players/[id]/stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;
    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // Get search params for optional filters
    const searchParams = request.nextUrl.searchParams;
    const season = searchParams.get('season');
    const gameIdParam = searchParams.get('gameId');
    
    // Parse gameId to integer if provided
    const gameId = gameIdParam ? parseInt(gameIdParam, 10) : null;
    
    // Get player stats using raw SQL to avoid Prisma type issues
    let playerStats;
    
    if (gameId && !isNaN(gameId)) {
      // If gameId is provided, filter by both player and game
      playerStats = await prisma.$queryRaw`
        SELECT ps.*, g.game as "gameName", s.name as "statTypeName"
        FROM "PlayerStat" ps
        LEFT JOIN "Game" g ON ps."gameId" = g.id
        LEFT JOIN "Stat" s ON ps."statId" = s.id
        WHERE ps."playerId" = ${playerId}
        AND ps."gameId" = ${gameId}
        ORDER BY ps."created_at" DESC
      `;
    } else {
      // Otherwise just filter by player
      playerStats = await prisma.$queryRaw`
        SELECT ps.*, g.game as "gameName", s.name as "statTypeName"
        FROM "PlayerStat" ps
        LEFT JOIN "Game" g ON ps."gameId" = g.id
        LEFT JOIN "Stat" s ON ps."statId" = s.id
        WHERE ps."playerId" = ${playerId}
        ORDER BY ps."created_at" DESC
      `;
    }
    
    return NextResponse.json({ success: true, data: playerStats });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Error fetching player stats' },
      { status: 500 }
    );
  }
} 