import type { Session as SupabaseSession } from '@supabase/supabase-js'

declare module '@supabase/supabase-js' {
    interface Session extends SupabaseSession {
        user: {
            id: string
            email: string
            role: 'ADMIN' | 'USER'
        } & SupabaseSession['user']
    }
}
