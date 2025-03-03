import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { logger } from '@/utils/logger';

// Validation schema for password reset
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  logger.info('Password reset request', {
    path: '/api/auth/reset-password',
  });

  console.log('Password reset request received');

  try {
    // Parse the request body if it's a string
    let bodyToParse = req.body;
    if (typeof req.body === 'string') {
      try {
        bodyToParse = JSON.parse(req.body);
      } catch (parseError) {
        console.error('Error parsing request body string:', parseError);
        if (req.body.includes('=')) {
          const params = new URLSearchParams(req.body);
          bodyToParse = Object.fromEntries(params.entries());
        }
      }
    }
    
    console.log('Body to parse:', bodyToParse);
    
    // Validate request body
    const validated = resetPasswordSchema.parse(bodyToParse);
    console.log(`Attempting to reset password for: ${validated.email}`);

    // Only allow this in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'This endpoint is only available in development mode',
        code: 'dev_only'
      });
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
      return res.status(500).json({ 
        error: 'Failed to send password reset email', 
        code: 'reset_error',
        message: resetError.message
      });
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
    return res.status(200).json({
      success: true,
      message: 'Password reset email sent. Please check your email and click the link to complete the password reset process. After resetting your password, you will be able to log in with your new credentials.'
    });
    
  } catch (error) {
    console.error('Error in password reset:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
