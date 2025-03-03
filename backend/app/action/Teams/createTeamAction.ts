// used to create a volleyball team in the app

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type CreateTeamInput = {
    name: string;
    id: string;
    managerId: string;
}

export async function createTeamAction(team: CreateTeamInput) {
    // create team
    try {
        const { managerId, ...teamData } = team;
        
        const teamResponse = await prisma.team.create({
            data: {
                ...teamData,
                manager: {
                    connect: { id: managerId }
                }
            },
        })
     
        return teamResponse;
    }
    catch (error) {
        console.error('Error creating team:', error);
        throw new Error('Error creating team');
    }
}