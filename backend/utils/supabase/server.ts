import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

/**
 * Create a Supabase client instance
 * @param token Optional auth token to initialize the client with
 * @returns Supabase client instance
 */
export async function createClient(token?: string | null) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Creating Supabase client');
    console.log('SUPABASE_URL exists:', !!supabaseUrl);
    console.log('SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseAnonKey) {
        logger.error('Missing Supabase environment variables');
        throw new Error('Missing required environment variables for Supabase client');
    }

    const options = {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        },
        global: {
            headers: token ? {
                Authorization: `Bearer ${token}`
            } : undefined
        }
    };

    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, options);
    console.log('Supabase client created successfully');

    return client;
}
