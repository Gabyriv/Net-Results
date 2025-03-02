import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const createClient = async (_, serviceRoleKey?: string) => {
  try {
    console.log('Creating Supabase client');
    console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create Supabase client without SSR-specific cookie handling
    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: false // Don't persist session in localStorage for server-side
      }
    };

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options
    );
    
    console.log('Supabase client created successfully');
    return supabase;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
};
