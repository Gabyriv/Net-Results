import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatType } from '@prisma/client';
import { randomUUID } from 'crypto';

// Create a single PrismaClient instance for the whole app
const prisma = new PrismaClient();

// POST /api/games/[id]/player-stats/batch
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
    const { stats } = body;
    
    // Input validation
    if (!stats || !Array.isArray(stats) || stats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid stats array' }, 
        { status: 400 }
      );
    }
    
    console.log(`Received batch of ${stats.length} player stats for game ${gameId}`);
    
    // Use a transaction for better performance and data consistency
    return await prisma.$transaction(async (tx) => {
      // Check if game exists (only once)
      const game = await tx.game.findUnique({
        where: { id: gameId }
      });
      
      if (!game) {
        return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
      }
      
      // Pre-fetch all player data in one query to avoid multiple lookups
      const playerIds = [...new Set(stats.map(stat => stat.playerId))];
      const players = await tx.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, teamId: true }
      });
      
      // Create a map for quick player lookup
      const playerMap = new Map();
      players.forEach(player => {
        playerMap.set(player.id, player);
      });
      
      // Find a default team for players without teams (do this only once)
      let defaultTeamId: string | null = null;
      const playersWithoutTeam = players.filter(p => !p.teamId);
      
      if (playersWithoutTeam.length > 0) {
        // Try to find an existing team
        const anyTeam = await tx.team.findFirst({
          select: { id: true }
        });
        
        if (anyTeam) {
          defaultTeamId = anyTeam.id;
        } else {
          // Create a default team if needed
          try {
            const manager = await tx.manager.findFirst({
              where: { userId: game.userId },
              select: { id: true }
            });
            
            if (manager) {
              const newTeam = await tx.team.create({
                data: {
                  id: randomUUID(),
                  name: "Default Team",
                  managerId: manager.id
                }
              });
              defaultTeamId = newTeam.id;
            }
          } catch (err) {
            console.error('Error creating default team:', err);
          }
        }
      }
      
      // Prepare all valid stats for bulk insert
      const statsToCreate = [];
      const errors = [];
      
      for (const stat of stats) {
        try {
          // Skip if missing required fields
          if (!stat.playerId || !stat.statType || stat.value === undefined) {
            continue;
          }
          
          // Validate stat type
          if (!Object.values(StatType).includes(stat.statType as StatType)) {
            continue;
          }
          
          // Convert value to quality string
          let quality;
          if (stat.value === 3) quality = '+';
          else if (stat.value === 2) quality = '=';
          else if (stat.value === 1) quality = '-';
          else quality = '0';
          
          // Get player's team or use default team
          let teamId = stat.teamId;
          const player = playerMap.get(stat.playerId);
          
          if (!teamId && player && player.teamId) {
            teamId = player.teamId;
          }
          
          if (!teamId && defaultTeamId) {
            teamId = defaultTeamId;
          }
          
          // Skip if we still don't have a teamId
          if (!teamId) {
            continue;
          }
          
          // Create stat object for bulk operation
          statsToCreate.push({
            id: randomUUID(),
            playerId: stat.playerId,
            gameId: gameId,
            teamId: teamId,
            statType: stat.statType as StatType,
            value: Number(stat.value || 0),
            quality: quality,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (err) {
          errors.push({
            stat: { 
              playerId: stat.playerId, 
              statType: stat.statType, 
              value: stat.value 
            },
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
      
      // Perform bulk create if we have valid stats
      let savedCount = 0;
      if (statsToCreate.length > 0) {
        try {
          // Use createMany for better performance
          const result = await tx.playerStats.createMany({
            data: statsToCreate,
            skipDuplicates: true
          });
          
          savedCount = result.count;
          console.log(`Successfully created ${savedCount} stat records in bulk operation`);
        } catch (bulkError) {
          console.error('Error in bulk insert:', bulkError);
          
          // Fallback to individual inserts if bulk fails
          console.log('Falling back to individual inserts...');
          for (const statData of statsToCreate) {
            try {
              await tx.playerStats.create({ data: statData });
              savedCount++;
            } catch (singleError) {
              console.error('Error in individual insert:', singleError);
            }
          }
        }
      }
      
      // Return success response with results
      return NextResponse.json({
        success: savedCount > 0,
        count: savedCount,
        message: `Successfully saved ${savedCount} player stats`,
        totalRequested: stats.length,
        errors: errors.length > 0 ? errors : undefined
      });
    }, {
      maxWait: 10000, // 10s maximum wait time
      timeout: 15000  // 15s transaction timeout
    });
    
  } catch (error) {
    console.error('Error saving batch player stats:', error);
    
    // Create a safe error response
    return NextResponse.json({
      success: false,
      error: 'Database error',
      details: error instanceof Error ? error.message : String(error || 'Unknown error')
    }, { status: 500 });
  }
} 