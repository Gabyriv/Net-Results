import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "@/config/prisma";
import bcrypt from "bcryptjs";
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { checkRole } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';
import { Role } from '@prisma/client';


// User schema for validation
const UserSchema = z.object({
  // Use a more strict email regex that matches Supabase's validation
  email: z.string().email().refine(
    (email) => {
      // Basic regex for email validation that's more strict
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    },
    { message: "Email address is invalid" }
  ),
  // Add password validation
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters long").max(50),
  role: z.enum(["Manager", "Player"]).default("Manager"),
});

type ResponseData = {
  success?: boolean;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
  data?: Record<string, unknown>;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    // No auth required for user registration
    try {
      const body = req.body;
      const validated = UserSchema.parse(body);

      try {
        console.log('Attempting to sign up user with email:', validated.email);

        // First check if the user already exists in Prisma
        const existingUser = await prisma.user.findUnique({
          where: { email: validated.email }
        });

        if (existingUser) {
          return res.status(409).json({
            error: 'Email already exists'
          });
        }

        try {
          // First, create the user in Supabase Auth
          console.log('Creating user in Supabase Auth');
          // Create regular client for signup
          const supabase = await createClient(null);
          
          // Create admin client for email confirmation
          const adminClient = await createClient(undefined, process.env.SUPABASE_SERVICE_ROLE_KEY);
          
          // Variables we'll need throughout the function
          let userId;
          let user;
          let role;
          
          try {
            console.log(`Attempting to sign up user with email: ${validated.email} in Supabase Auth`);
            // Determine if we're in development mode
            const isDevelopment = process.env.NODE_ENV !== 'production';
            console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
            
            // In development mode, we'll use a special approach to handle email confirmation
            let signUpOptions = {};
            
            if (isDevelopment) {
              console.log('Development mode: Setting up for auto-confirmation');
              // For development, we'll use a special option to disable email confirmation
              signUpOptions = {
                email: validated.email,
                password: validated.password,
                options: {
                  data: {
                    displayName: validated.displayName,
                    role: validated.role || 'Player'
                  },
                  emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
                }
              };
            } else {
              // For production, we'll use the standard approach with email confirmation
              signUpOptions = {
                email: validated.email,
                password: validated.password,
                options: {
                  data: {
                    displayName: validated.displayName,
                    role: validated.role || 'Manager'
                  },
                  emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
                }
              };
            }
            
            // Create the user in Supabase Auth with the appropriate options
            console.log('Signing up user with options:', JSON.stringify(signUpOptions, null, 2));
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: validated.email,
              password: validated.password,
              options: {
                data: {
                  displayName: validated.displayName,
                  role: validated.role || 'Player'
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
              }
            });
            
            if (authError) {
              console.error('Error signing up user:', authError.message);
              return res.status(400).json({ 
                error: authError.message, 
                code: 'auth_error' 
              });
            }
            
            console.log('Auth signup response:', JSON.stringify(authData, null, 2));

            // Create the user in Prisma
            if (authData?.user) {
              try {
                // Create user in Prisma
                const prismaUser = await prisma.user.create({
                  data: {
                    id: authData.user.id,
                    email: validated.email,
                    password: await bcrypt.hash(validated.password, 10),
                    displayName: validated.displayName,
                    role: validated.role as Role
                  }
                });

                // If user is a Manager, create manager record
                if (validated.role === 'Manager') {
                  await prisma.manager.create({
                    data: {
                      id: `mgr_${Date.now()}`,
                      displayName: validated.displayName,
                      userId: prismaUser.id
                    }
                  });
                }

                // If user is a Player, create player record
                if (validated.role === 'Player') {
                  await prisma.player.create({
                    data: {
                      id: `plr_${Date.now()}`,
                      displayName: validated.displayName,
                      gamesPlayed: 0,
                      userId: prismaUser.id
                    }
                  });
                }
              } catch (prismaError) {
                console.error('Error creating user in Prisma:', prismaError);
                // If Prisma creation fails, delete the Supabase user
                await adminClient.auth.admin.deleteUser(authData.user.id);
                return res.status(500).json({
                  error: 'Failed to create user record',
                  details: { message: prismaError instanceof Error ? prismaError.message : 'Unknown error' }
                });
              }
            }
            
            // For development, we'll attempt to automatically confirm the email
            if (isDevelopment && authData?.user) {
              console.log('Development environment: attempting to confirm email automatically');
              try {
                // Wait a short moment for the user to be fully created
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Use the built-in fetch API instead of node-fetch
                const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/confirm-email`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: validated.email,
                    password: validated.password
                  })
                });
                
                const confirmResult = await response.json();
                
                if (!response.ok) {
                  console.warn('Email confirmation failed:', confirmResult.error);
                  throw new Error(confirmResult.message || 'Email confirmation failed');
                }
                
                console.log('Email confirmation successful:', confirmResult.success);
                
                // Now attempt to sign in the user
                console.log('Attempting to sign in after email confirmation');
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                  email: validated.email,
                  password: validated.password
                });
                
                if (signInError) {
                  console.warn('Auto-login failed:', signInError.message);
                } else if (signInData?.session) {
                  console.log('Auto-login successful!');
                  // Set auth cookies with proper domain and path
                  res.setHeader('Set-Cookie', [
                    `sb-access-token=${signInData.session.access_token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; ${process.env.NODE_ENV === 'production' ? 'Secure; SameSite=Lax' : ''}`,
                    `sb-refresh-token=${signInData.session.refresh_token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; ${process.env.NODE_ENV === 'production' ? 'Secure; SameSite=Lax' : ''}`
                  ]);
                }
              } catch (error) {
                console.warn('Error during auto email confirmation/login attempt:', error);
              }
            }
            
            if (authError) {
              console.error('Error creating user in Supabase Auth:', authError);
              
              // Handle specific Supabase auth errors with appropriate status codes
              if (authError && typeof authError === 'object' && 'status' in authError) {
                const typedError = authError as { status: number; code?: string; message?: string };
                
                if (typedError.status === 400) {
                  if (typedError.code === 'email_address_invalid') {
                    return res.status(400).json({
                      error: 'Invalid email address format',
                      details: { message: 'Please provide a valid email address' }
                    });
                  } else if (typedError.code === 'user_already_exists') {
                    return res.status(409).json({
                      error: 'Email already exists',
                      details: { message: 'This email is already registered' }
                    });
                  } else if ('code' in typedError && typedError.code === 'weak_password') {
                    return res.status(400).json({
                      error: 'Password too weak',
                      details: { message: 'Please provide a stronger password' }
                    });
                  }
                }
              }
              
              // Generic error for other cases
              return res.status(500).json({
                error: 'Error creating user in authentication system',
                details: { message: typeof authError === 'object' && authError !== null ? 
                  ('message' in authError ? String((authError as any).message) : String(authError)) : 
                  String(authError) }
              });
            }
            
            if (!authData.user) {
              console.error('No user returned from Supabase Auth');
              return res.status(500).json({
                error: 'Error creating user in authentication system',
                details: { message: 'No user data returned' }
              });
            }
          
            console.log('User created in Supabase Auth');
            
            // Use the Supabase user ID
            userId = authData.user.id;
            
            // Determine the role
            role = validated.role ? (validated.role === "Manager" ? "Manager" : "Player") : "Player";
            
            // Create the user in our database
            console.log('Creating user in database with ID:', userId);
            user = await prisma.user.create({
              data: {
                id: userId,
                email: validated.email,
                displayName: validated.displayName,
                role: role as Role,
                password: 'SUPABASE_MANAGED' // This is just a placeholder since Supabase manages passwords
              },
              select: {
                id: true,
                email: true,
                displayName: true,
                role: true
              }
            });
          } catch (error) {
            console.error('Error during Supabase signup or database creation:', error);
            return handleServerError(error, res);
          }
          
          // If the user is a Manager, create a Manager record
          if (role === "Manager") {
            try {
              const managerId = uuidv4();
              
              // Create the Manager record
              await prisma.manager.create({
                data: {
                  id: managerId,
                  displayName: validated.displayName,
                  user: {
                    connect: { id: userId }
                  }
                }
              });
              
              // Update the user with the managerId
              await prisma.user.update({
                where: { id: userId },
                data: {
                  managerId: managerId
                }
              });
              
              console.log(`Created Manager record with ID ${managerId} for user ${userId}`);
            } catch (managerError) {
              console.error('Error creating Manager record:', managerError);
              // We've already created the user, so we'll just log the error and continue
            }
          }
          
          // Prepare a response message based on the environment
          const responseMessage = process.env.NODE_ENV !== 'production'
            ? 'User created successfully. In development mode, you can log in immediately without email verification.'
            : 'User created successfully. Please check your email to verify your account before logging in.';
          
          return res.status(201).json({ 
            success: true, 
            data: user,
            message: responseMessage
          });
        } catch (prismaError) {
          console.error('Error creating user in Prisma:', prismaError);
          return handleServerError(prismaError, res);
        }
      } catch (error) {
        console.error('Error creating user:', error);
        return handleServerError(error, res);
      }
    } catch (error) {
      return handleServerError(error, res);
    }
  } else if (req.method === 'GET') {
    // Check authentication and role
    const authResult = await checkRole(req, 'Manager');
    
    if (!authResult.authorized) {
      return res.status(authResult.status).json({ error: authResult.error });
    }
    
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          manager: true,
          player: true
        }
      });
      
      return res.status(200).json({ 
        success: true, 
        data: { users } 
      });
    } catch (error) {
      return handleServerError(error, res);
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
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
    const prismaError = error as unknown as { code: string; message: string };
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
