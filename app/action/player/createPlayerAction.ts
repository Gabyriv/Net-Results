"use server"
// used to create a volleyball player in the app

import { prisma } from "@/lib/prisma";

export async function createPlayerAction  (player: Player)  {
    // create player
        const playerResponse = await prisma.player.create({
            data: {
               ...player,
            },
        })

    return playerResponse;
}