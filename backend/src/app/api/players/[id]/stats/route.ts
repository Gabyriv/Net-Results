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
    // First, ensure we have valid params object by awaiting it
    const resolvedParams = await params;
    const playerId = resolvedParams.id;
    
    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // Get search params for optional filters
    const searchParams = request.nextUrl.searchParams;
    const season = searchParams.get('season');
    const gameIdParam = searchParams.get('gameId');
    
    // Parse gameId to integer if provided
    const gameId = gameIdParam ? parseInt(gameIdParam, 10) : null;
    
    // Get player stats using Prisma instead of raw SQL for better type safety
    let playerStats;
    
    try {
      // Using Prisma's native query instead of raw SQL
      playerStats = await prisma.playerStats.findMany({
        where: {
          playerId: playerId,
          ...(gameId ? { gameId: gameId.toString() } : {})
        },
        include: {
          Game: {
            select: {
              game: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Format the result to match expected output
      const formattedStats = playerStats.map(stat => ({
        ...stat,
        gameName: stat.Game?.game || `Game ${stat.gameId}`
      }));
      
      return NextResponse.json({ success: true, data: formattedStats });
      
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Error querying player stats from database' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    // Fix error handling by providing a proper error object
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error fetching player stats', message: errorMessage },
      { status: 500 }
    );
  }
} 