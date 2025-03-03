import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from "next/server";
import { parse } from 'cookie';

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Create Supabase client
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        }
      }
    );
    
    // Get token from cookies if available
    let token = null;
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = parse(cookieHeader);
      token = cookies.auth_token;
    }
    
    // If no token in cookies, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Get user information if token is available
    let user = null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) {
        user = data.user;
      } else {
        console.error('Error getting user from token:', error);
      }
    } else {
      // Try to get session without token
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        user = data.session.user;
      }
    }

    // Handle protected routes (customize as needed for your app)
    if (request.nextUrl.pathname.startsWith("/api/protected") && !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return response;
  } catch (error) {
    console.error('Error in updateSession middleware:', error);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
