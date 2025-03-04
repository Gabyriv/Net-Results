import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/server-logger';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { handleServerError } from '@/app/api/errors_handlers/server-errors';

// Validation schema for email confirmation
const confirmEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: Request) {
  logger.info('Email confirmation request', {
    path: '/api/auth/confirm-email',
  });

  console.log('Email confirmation request received');

  try {
    // Parse the request body
    let bodyToParse;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      bodyToParse = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      bodyToParse = Object.fromEntries(formData.entries());
    } else {
      // Try to parse as JSON as a fallback
      try {
        const text = await request.text();
        bodyToParse = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return NextResponse.json({ 
          error: 'Invalid request format' 
        }, { status: 400 });
      }
    }
    
    console.log('Body to parse:', bodyToParse);
    
    // Validate request body
    const validated = confirmEmailSchema.parse(bodyToParse);
    console.log(`Attempting to confirm email for: ${validated.email}`);

    // Only allow this in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'This endpoint is only available in development mode',
        code: 'dev_only'
      }, { status: 403 });
    }

    // Create Supabase client
    const supabase = await createClient(undefined, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // In development mode, we'll use a simpler approach
    // Instead of checking if the user exists (which requires admin privileges),
    // we'll just proceed with the password reset flow directly

    // Use Supabase admin API to confirm email
    console.log('Using Supabase admin API to confirm email');
    
    // First, get the user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError);
      return NextResponse.json({ 
        error: 'Failed to fetch users', 
        code: 'fetch_error',
        message: getUserError.message
      }, { status: 500 });
    }
    
    const user = users.find(u => u.email === validated.email);
    
    if (!user) {
      console.error('User not found:', validated.email);
      return NextResponse.json({ 
        error: 'User not found', 
        code: 'user_not_found',
        message: 'No user found with this email address'
      }, { status: 404 });
    }
    
    // Update the user to confirm their email
    console.log('Updating user to confirm email');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error('Error confirming email:', updateError);
      return NextResponse.json({ 
        error: 'Failed to confirm email', 
        code: 'update_error',
        message: updateError.message
      }, { status: 500 });
    }
    
    // Try to sign in the user to verify everything works
    console.log('Testing login with updated credentials');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: bodyToParse.password || '1234567890'
    });
    
    if (signInError) {
      console.warn('Test login failed:', signInError.message);
    } else {
      console.log('Test login successful!');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Email confirmation process initiated. In development mode, you can now try to log in.'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error in email confirmation:', error);
    return handleServerError(error);
  }
} 