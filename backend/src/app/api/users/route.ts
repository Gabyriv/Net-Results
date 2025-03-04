import { prisma } from "@/config/prisma";
import bcrypt from "bcryptjs";
import { z } from 'zod';
import { checkRole } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { handleServerError } from '@/app/api/errors_handlers/server-errors';

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

export async function POST(request: Request) {
  // No auth required for user registration
  try {
    const body = await request.json();
    const validated = UserSchema.parse(body);

    try {
      console.log('Attempting to sign up user with email:', validated.email);

      // First check if the user already exists in Prisma
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email }
      });

      if (existingUser) {
        return NextResponse.json({
          error: 'Email already exists'
        }, { status: 409 });
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
            return NextResponse.json({ 
              error: authError.message, 
              code: 'auth_error' 
            }, { status: 400 });
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
              return NextResponse.json({
                error: 'Failed to create user record',
                details: { message: prismaError instanceof Error ? prismaError.message : 'Unknown error' }
              }, { status: 500 });
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
              
              const confirmResult = await response.json() as { error?: string; success?: boolean };
              
              if (!response.ok) {
                console.warn('Email confirmation failed:', confirmResult.error);
                throw new Error(confirmResult.error || 'Email confirmation failed');
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
                // Create response with auth cookies
                const nextResponse = NextResponse.json({
                  success: true,
                  message: 'User created successfully and logged in',
                  data: {
                    user: {
                      id: authData.user.id,
                      email: validated.email,
                      displayName: validated.displayName,
                      role: validated.role
                    }
                  }
                }, { status: 201 });
                
                // Set cookies in the response
                nextResponse.cookies.set('sb-access-token', signInData.session.access_token, {
                  httpOnly: true,
                  path: '/',
                  maxAge: 60 * 60 * 24 * 7, // 1 week
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: process.env.NODE_ENV === 'production' ? 'lax' : undefined
                });
                
                nextResponse.cookies.set('sb-refresh-token', signInData.session.refresh_token, {
                  httpOnly: true,
                  path: '/',
                  maxAge: 60 * 60 * 24 * 7, // 1 week
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: process.env.NODE_ENV === 'production' ? 'lax' : undefined
                });
                
                return nextResponse;
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
                  return NextResponse.json({
                    error: 'Invalid email address format',
                    details: { message: 'Please provide a valid email address' }
                  }, { status: 400 });
                } else if (typedError.code === 'user_already_exists') {
                  return NextResponse.json({
                    error: 'Email already exists',
                    details: { message: 'This email is already registered' }
                  }, { status: 409 });
                }
              }
            }
            
            return NextResponse.json({
              error: 'Failed to create user',
              details: { message: authError.message }
            }, { status: 500 });
          }
          
          // Return success response
          return NextResponse.json({
            success: true,
            message: 'User created successfully',
            data: {
              user: {
                id: authData?.user?.id,
                email: validated.email,
                displayName: validated.displayName,
                role: validated.role
              }
            }
          }, { status: 201 });
          
        } catch (error) {
          console.error('Error in user creation process:', error);
          return handleServerError(error);
        }
      } catch (error) {
        console.error('Error creating user in Supabase Auth:', error);
        return handleServerError(error);
      }
    } catch (error) {
      console.error('Error checking for existing user:', error);
      return handleServerError(error);
    }
  } catch (error) {
    console.error('Error validating user data:', error);
    return handleServerError(error);
  }
}

export async function GET(request: Request) {
  try {
    // Check if the user has the required role (Manager)
    const authResult = await checkRole(request, 'Manager');
    
    if (!authResult.authorized) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'You do not have permission to access this resource' 
      }, { status: 403 });
    }
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: { users } 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return handleServerError(error);
  }
} 