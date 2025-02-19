import { DefaultSession } from '@supabase/auth-helpers-nextjs'

declare module '@supabase/auth-helpers-nextjs' {
    interface Session extends DefaultSession {
        user: {
            id: string
            email: string
            role: 'ADMIN' | 'USER'
        } & DefaultSession['user']
    }
}
