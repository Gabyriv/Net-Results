import React, { Suspense } from 'react'
import PlayersList from './PlayersList'
import { prisma } from '@/lib/prisma'
import CreatePlayer from './CreatePlayer'

export default async function PlayersPage() {
  
  const players = await prisma.player.findMany({select: {id: true, displayName: true, playerStats: true, gamesPlayed: true}})
  
  console.info("The players are:",players)
  
  return (
    <div>
      <h1>Players</h1>  
      <Suspense fallback={<div>Loading...</div>}>
        {/* <PlayersList players={players} /> */}
        <CreatePlayer/>
      </Suspense>


    </div>
  )
}

