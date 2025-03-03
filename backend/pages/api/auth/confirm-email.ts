import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { logger } from '@/utils/logger';

// Validation schema for email confirmation
const confirmEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  logger.info('Email confirmation request', {
    path: '/api/auth/confirm-email',
  });

  console.log('Email confirmation request received');

  try {
    console.log('Request body received:', typeof req.body, req.body);
    
    // Parse the request body if it's a string (happens with some clients)
    let bodyToParse = req.body;
    if (typeof req.body === 'string') {
      try {
        bodyToParse = JSON.parse(req.body);
      } catch (parseError) {
        console.error('Error parsing request body string:', parseError);
        // If we can't parse it as JSON, check if it's a URL-encoded form
        if (req.body.includes('=')) {
          const params = new URLSearchParams(req.body);
          bodyToParse = Object.fromEntries(params.entries());
        }
      }
    }
    
    console.log('Body to parse:', bodyToParse);
    
    // Validate request body
    const validated = confirmEmailSchema.parse(bodyToParse);
    console.log(`Attempting to confirm email for: ${validated.email}`);

    // Only allow this in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'This endpoint is only available in development mode',
        code: 'dev_only'
      });
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
      return res.status(500).json({ 
        error: 'Failed to fetch users', 
        code: 'fetch_error',
        message: getUserError.message
      });
    }
    
    const user = users.find(u => u.email === validated.email);
    
    if (!user) {
      console.error('User not found:', validated.email);
      return res.status(404).json({ 
        error: 'User not found', 
        code: 'user_not_found',
        message: 'No user found with this email address'
      });
    }
    
    // Update the user to confirm their email
    console.log('Updating user to confirm email');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error('Error confirming email:', updateError);
      return res.status(500).json({ 
        error: 'Failed to confirm email', 
        code: 'update_error',
        message: updateError.message
      });
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
    return res.status(200).json({
      success: true,
      message: 'Email confirmation process initiated. In development mode, you can now try to log in.'
    });
    
  } catch (error) {
    console.error('Error in email confirmation:', error);
    
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
