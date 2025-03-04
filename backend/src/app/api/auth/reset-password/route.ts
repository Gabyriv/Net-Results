import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/server-logger';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { handleServerError } from '@/app/api/errors_handlers/server-errors';

// Validation schema for password reset
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  logger.info('Password reset request', {
    path: '/api/auth/reset-password',
  });

  console.log('Password reset request received');

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
    const validated = resetPasswordSchema.parse(bodyToParse);
    console.log(`Attempting to reset password for: ${validated.email}`);

    // Only allow this in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'This endpoint is only available in development mode',
        code: 'dev_only'
      }, { status: 403 });
    }

    // Create Supabase client
    const supabase = await createClient(null);
    
    // Development approach for password reset
    // First, send a password reset email
    console.log(`[DEV ONLY] Initiating password reset for ${validated.email}`);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(validated.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
    });
    
    if (resetError) {
      console.error('Error sending password reset email:', resetError.message);
      return NextResponse.json({ 
        error: 'Failed to send password reset email', 
        code: 'reset_error',
        message: resetError.message
      }, { status: 500 });
    }
    
    // For development convenience, we'll also try to update the password directly
    // This is a workaround that may or may not work depending on Supabase configuration
    console.log(`[DEV ONLY] Attempting to sign in with OTP for ${validated.email}`);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: validated.email,
    });
    
    if (otpError) {
      console.warn(`[DEV ONLY] OTP sign-in failed: ${otpError.message}`);
      // Continue anyway - the user can still use the password reset email
    } else {
      console.log('[DEV ONLY] OTP sign-in successful');
    }

    // Return success response with instructions
    return NextResponse.json({
      success: true,
      message: 'Password reset email sent. Please check your email and click the link to complete the password reset process. After resetting your password, you will be able to log in with your new credentials.'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error in password reset:', error);
    return handleServerError(error);
  }
} 