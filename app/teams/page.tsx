import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import CreateTeam from "./CreateTeam"





export default async function teamPage() {
    const teams = await prisma.team.findMany({select: {id: true}})

    console.info("The teams are:", teams)

    return (
        <div>
            <h1>Teams</h1>
            <Suspense fallback={<div>Loading...</div>}>
                <CreateTeam/>
            </Suspense>

            
        </div>
    )
}