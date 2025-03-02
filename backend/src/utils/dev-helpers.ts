import { createClient } from './supabase/server';
import { logger } from './logger';

/**
 * Development-only utility to bypass email confirmation
 * This should NEVER be used in production
 */
export async function devBypassEmailConfirmation(email: string): Promise<{ success: boolean; message: string }> {
  // Safety check - only allow in development
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Attempted to use development bypass in production', { email });
    return {
      success: false,
      message: 'This utility can only be used in development environments'
    };
  }

  try {
    logger.info('Attempting development email confirmation bypass', { email });
    console.log(`[DEV] Attempting to bypass email confirmation for: ${email}`);
    
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    // First, check if the user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return {
        success: false,
        message: `Error fetching users: ${userError.message}`
      };
    }
    
    // Find the user by email
    const user = userData?.users?.find(u => u.email === email);
    
    if (!user) {
      console.error('User not found:', email);
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    console.log(`[DEV] Found user with ID: ${user.id}`);
    
    // Update the user to confirm their email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error('Error confirming email:', updateError);
      return {
        success: false,
        message: `Error confirming email: ${updateError.message}`
      };
    }
    
    console.log(`[DEV] Successfully confirmed email for user: ${email}`);
    logger.info('Development email confirmation bypass successful', { email });
    
    return {
      success: true,
      message: 'Email confirmed successfully'
    };
  } catch (error) {
    console.error('Error in development email confirmation bypass:', error);
    logger.error('Error in development email confirmation bypass', error instanceof Error ? error : new Error(String(error)));
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
