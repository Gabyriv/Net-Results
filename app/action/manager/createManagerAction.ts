import { prisma } from "@/lib/prisma";

interface CreateManagerInput {
    id: any;
    user: any;
    displayName: string;

}

export async function createManagerAction(input: CreateManagerInput) {
    try {
        const newManager = await prisma.manager.create({
            data: {
                id: input.id,
                user: input.user,
                displayName: input.displayName,
            },
        });
        return newManager;
    } catch (error) {
        console.error('Error creating manager:', error);
        throw new Error('Error creating manager');
    }
}