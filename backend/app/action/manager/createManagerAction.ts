import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";

export async function createManagerAction(form: FormData) {
    const supabase = await createClient();

    try {
        console.log('Creating manager...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not found');
        }

        const displayName = form.get('name');
        console.log('Display name:', displayName);

        if (!displayName || typeof displayName !== 'string') {
            throw new Error('Name is required and must be a string');
        }

        const newManager = await prisma.manager.create({
            data: {
                id: input.id,
                user: input.user,
                displayName: input.displayName,
            },
        });

        console.log('Manager created:', newManager);
        return newManager;
    } catch (error) {
        console.error('Error creating manager:', error);
        throw new Error('Error creating manager');
    }
}