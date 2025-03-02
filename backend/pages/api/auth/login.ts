import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/logger';

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
        session: any;
        user: any;
    };
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    // Only allow POST method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
        const body = req.body;
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
                            return res.status(401).json({ 
                                error: 'Email not confirmed', 
                                code: 'email_not_confirmed',
                                message: 'Your email is not confirmed. In development mode, you can use the /api/auth/confirm-email endpoint to manually confirm your email.',
                                devHelper: {
                                    endpoint: '/api/auth/confirm-email',
                                    method: 'POST',
                                    body: { email: validated.email }
                                }
                            });
                        } else {
                            return res.status(401).json({ 
                                error: 'Email not confirmed', 
                                code: 'email_not_confirmed',
                                message: 'Please check your email to confirm your account before logging in.'
                            });
                        }
                    } else if (authError.message === 'Invalid login credentials') {
                        return res.status(401).json({ 
                            error: 'Invalid login credentials', 
                            code: 'invalid_credentials',
                            message: 'The email or password you entered is incorrect.'
                        });
                    }
                }
                
                // Generic error response for other cases
                return res.status(401).json({ 
                    error: 'Authentication failed', 
                    code: 'auth_failed',
                    message: authError?.message || 'Unable to authenticate'
                });
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
                
                return res.status(401).json({ 
                    error: 'User account incomplete', 
                    code: 'user_not_found' 
                });
            }
            
            logger.info('Login successful', { 
                userId: user.id,
                role: user.role
            });
            
            // Create session with user metadata
            const session = {
                ...authData.session,
                user: {
                    ...authData.session.user,
                    role: user.role,
                    user_metadata: {
                        ...authData.session.user.user_metadata,
                        role: user.role,
                        displayName: user.displayName
                    }
                }
            };
            
            // Prepare successful login response
            console.log('Preparing successful login response');
            const responseData = { 
                success: true, 
                data: { 
                    session, 
                    user: session.user
                } 
            };
            console.log('Response data prepared');
            
            // Set auth cookies
            console.log('Setting auth cookies');
            res.setHeader('Set-Cookie', [
              `sb-access-token=${authData.session.access_token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; Domain=localhost; ${process.env.NODE_ENV === 'production' ? 'Secure; SameSite=Lax' : ''}`,
              `sb-refresh-token=${authData.session.refresh_token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; Domain=localhost; ${process.env.NODE_ENV === 'production' ? 'Secure; SameSite=Lax' : ''}`
            ]);

            // Return successful login response with user data
            console.log('Returning successful login response');
            return res.status(200).json({
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
            });
        } catch (error) {
            console.error('Login processing error:', error);
            logger.error('Login processing error', error instanceof Error ? error : new Error(String(error)));
            return handleServerError(error, res);
        }
    } catch (error) {
        console.error('Login validation error:', error);
        logger.error('Login validation error', error instanceof Error ? error : new Error(String(error)));
        return handleServerError(error, res);
    }
}

// Helper function to handle server errors
function handleServerError(error: unknown, res: NextApiResponse) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({ 
            error: 'Validation error',
            details: error.errors 
        });
    }

    // Handle Prisma errors
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;
        switch (prismaError.code) {
            case 'P2002':
                return res.status(409).json({ error: 'Email already exists' });
            case 'P2025':
                return res.status(404).json({ error: 'Resource not found' });
            default:
                return res.status(500).json({ 
                    error: 'Database error', 
                    details: prismaError.message 
                });
        }
    }

    if (error instanceof Error && error.name === 'PrismaClientValidationError') {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    return res.status(500).json({ 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : String(error) 
    });
}
