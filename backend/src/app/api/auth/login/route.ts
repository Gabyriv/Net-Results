import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/server-logger';
import { NextResponse } from 'next/server';
import { handleServerError } from '@/app/api/errors_handlers/server-errors';

// Schema for login validation
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

// Type for the response data
type ResponseData = {
    success?: boolean;
    error?: string;
    code?: string;
    data?: {
        session: Record<string, unknown>;
        user: Record<string, unknown>;
    };
};

export async function POST(request: Request) {
    logger.info('Login attempt', { path: '/api/auth/login' });
    console.log('Login attempt received');
    
    // Check environment variables
    console.log('Environment variables check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'exists' : 'missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'exists' : 'missing');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'exists' : 'missing');
    console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'exists' : 'missing');
    
    try {
        // Validate request body
        const body = await request.json();
        console.log('Request body:', body);
        const validated = LoginSchema.parse(body);
        console.log('Validation passed for:', validated.email);

        try {
            console.log('Creating Supabase client');
            // Create Supabase client for authentication
            // Create admin client for better auth handling
            const supabase = await createClient(undefined, process.env.SUPABASE_SERVICE_ROLE_KEY);
            console.log('Supabase client created successfully');
            
            // Attempt to sign in with Supabase
            console.log('Attempting to sign in with Supabase');
            console.log('Login credentials:', { email: validated.email, passwordLength: validated.password?.length || 0 });
            
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: validated.email,
                password: validated.password
            });
            
            console.log('Supabase auth response received');
            if (authData) {
                console.log('Auth data exists:', !!authData.session);
                if (authData.session) {
                    console.log('Session info:', {
                        userId: authData.session.user.id,
                        expiresAt: authData.session.expires_at,
                        hasAccessToken: !!authData.session.access_token
                    });
                }
            }
            
            if (authError) {
                console.log('Auth error details:', {
                    message: authError.message,
                    status: authError.status,
                    name: authError.name
                });
            }
            
            if (authError || !authData.session) {
                logger.warn('Login failed', { 
                    email: validated.email,
                    error: authError?.message
                });
                
                // Check for specific error types and provide more helpful responses
                if (authError) {
                    if (authError.message === 'Email not confirmed') {
                        // In development mode, provide a more helpful message with the confirmation endpoint
                        if (process.env.NODE_ENV !== 'production') {
                            return NextResponse.json({ 
                                error: 'Email not confirmed', 
                                code: 'email_not_confirmed',
                                data: {
                                    session: { 
                                        endpoint: '/api/auth/confirm-email',
                                        method: 'POST'
                                    },
                                    user: { 
                                        email: validated.email 
                                    }
                                }
                            }, { status: 401 });
                        } else {
                            return NextResponse.json({ 
                                error: 'Please check your email to confirm your account before logging in.',
                                code: 'email_not_confirmed'
                            }, { status: 401 });
                        }
                    } else if (authError.message === 'Invalid login credentials') {
                        return NextResponse.json({ 
                            error: 'The email or password you entered is incorrect.',
                            code: 'invalid_credentials'
                        }, { status: 401 });
                    }
                }
                
                // Generic error response for other cases
                return NextResponse.json({ 
                    error: 'Authentication failed', 
                    code: 'auth_failed'
                }, { status: 401 });
            }
            
            // Get user data from database to include role and display name
            console.log('Importing Prisma client');
            const { prisma } = await import("@/config/prisma");
            console.log('Prisma client imported successfully');
            
            console.log('Querying database for user:', validated.email);
            const user = await prisma.user.findUnique({
                where: { email: validated.email },
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    role: true
                }
            });
            console.log('Database query result:', user ? 'User found' : 'User not found');
            
            if (!user) {
                logger.warn('User found in auth but not in database', { 
                    email: validated.email 
                });
                
                return NextResponse.json({ 
                    error: 'User account incomplete', 
                    code: 'user_not_found' 
                }, { status: 401 });
            }
            
            logger.info('Login successful', { 
                userId: user.id,
                role: user.role
            });
            
            // Prepare successful login response
            console.log('Preparing successful login response');
            console.log('Response data prepared');
            
            // Create response with auth cookies
            console.log('Setting auth cookies');
            const response = NextResponse.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName,
                        role: user.role
                    },
                    session: {
                        access_token: authData.session.access_token,
                        expires_at: authData.session.expires_at
                    }
                }
            }, { status: 200 });
            
            // Set cookies in the response
            response.cookies.set('sb-access-token', authData.session.access_token, {
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                domain: 'localhost',
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'lax' : undefined
            });
            
            response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                domain: 'localhost',
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'lax' : undefined
            });

            // Return successful login response with user data
            console.log('Returning successful login response');
            return response;
        } catch (error) {
            console.error('Login processing error:', error);
            logger.error('Login processing error', error instanceof Error ? error : new Error(String(error)));
            return handleServerError(error);
        }
    } catch (error) {
        console.error('Login validation error:', error);
        logger.error('Login validation error', error instanceof Error ? error : new Error(String(error)));
        return handleServerError(error);
    }
} 