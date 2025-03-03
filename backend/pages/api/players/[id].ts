import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/config/prisma';
import { createClient } from '@/utils/supabase/server';
import { getTokenFromRequest } from '@/utils/auth-utils';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Create authenticated Supabase Client
  const token = getTokenFromRequest(req);
  if (!token) {
    logger.warn('Unauthorized access attempt');
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }
  
  const supabase = await createClient(token);
  
  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    logger.warn('Unauthorized access attempt');
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      manager: true,
      player: true
    }
  });
  
  if (!dbUser) {
    logger.warn('User not found in database', { email: session.user.email });
    return res.status(404).json({
      error: 'User not found'
    });
  }

  // Handle PUT request to update player
  if (req.method === 'PUT') {
    try {
      const { teamId } = req.body;
      
      // If user is a manager, verify they own the team if teamId is provided
      if (dbUser.role === 'Manager' && teamId) {
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { managerId: true }
        });
        
        if (!team) {
          return res.status(404).json({ error: 'Team not found' });
        }
        
        if (!dbUser.manager || team.managerId !== dbUser.manager.id) {
          logger.warn('Unauthorized team access', { 
            managerId: dbUser.manager?.id, 
            teamId, 
            teamOwnerId: team.managerId 
          });
          return res.status(403).json({ error: 'You can only assign players to teams you manage' });
        }
      }
      
      // If user is a player, they can only update their own profile
      if (dbUser.role === 'Player') {
        const player = await prisma.player.findUnique({
          where: { id },
          select: { userId: true }
        });
        
        if (!player) {
          return res.status(404).json({ error: 'Player not found' });
        }
        
        if (player.userId !== dbUser.id) {
          logger.warn('Unauthorized player update attempt', { 
            playerId: id, 
            userId: dbUser.id 
          });
          return res.status(403).json({ error: 'You can only update your own player profile' });
        }
      }
      
      // Update the player
      const updatedPlayer = await prisma.player.update({
        where: { id },
        data: { 
          teamId: teamId === null ? null : teamId
        },
        include: {
          team: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              displayName: true,
              email: true
            }
          }
        }
      });
      
      logger.info('Player updated', { playerId: id, teamId });
      return res.status(200).json(updatedPlayer);
    } catch (error) {
      logger.error('Error updating player', 
        error instanceof Error ? error : new Error('Unknown error')
      );
      return res.status(500).json({ error: 'Failed to update player' });
    }
  }
  
  // Handle GET request to fetch a single player
  if (req.method === 'GET') {
    try {
      const player = await prisma.player.findUnique({
        where: { id },
        include: {
          team: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              displayName: true,
              email: true
            }
          }
        }
      });
      
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      return res.status(200).json(player);
    } catch (error) {
      logger.error('Error fetching player', 
        error instanceof Error ? error : new Error('Unknown error')
      );
      return res.status(500).json({ error: 'Failed to fetch player' });
    }
  }
  
  // Handle DELETE request
  if (req.method === 'DELETE') {
    // Only managers can delete players from their teams
    if (dbUser.role !== 'Manager') {
      return res.status(403).json({ error: 'Only managers can remove players from teams' });
    }
    
    try {
      // Get the player to check if they're in a team managed by this manager
      const player = await prisma.player.findUnique({
        where: { id },
        include: {
          team: {
            select: {
              managerId: true
            }
          }
        }
      });
      
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      // If player has a team, check if this manager manages it
      if (player.team && (!dbUser.manager || player.team.managerId !== dbUser.manager.id)) {
        logger.warn('Unauthorized player removal attempt', { 
          playerId: id, 
          managerId: dbUser.manager?.id,
          teamManagerId: player.team.managerId
        });
        return res.status(403).json({ error: 'You can only remove players from teams you manage' });
      }
      
      // Update the player to remove team association
      const updatedPlayer = await prisma.player.update({
        where: { id },
        data: { teamId: null },
        include: {
          user: {
            select: {
              displayName: true,
              email: true
            }
          }
        }
      });
      
      logger.info('Player removed from team', { playerId: id, managerId: dbUser.manager!.id });
      return res.status(200).json(updatedPlayer);
    } catch (error) {
      logger.error('Error removing player from team', 
        error instanceof Error ? error : new Error('Unknown error')
      );
      return res.status(500).json({ error: 'Failed to remove player from team' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
}
