import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import CreateManager from "./CreateManager"

export default async function ManagerPage() {
    const managers = await prisma.manager.findMany({select: {id: true, displayName: true, }})

    managers.forEach(manager => {
        console.info('Manager ID:', manager.id, 'Manager Display Name:', manager.displayName)
    })

    return (
        <div>
            <h1>Manager</h1>
            <Suspense fallback={<div>Loading...</div>}>
            </Suspense>
        </div>
    )
}