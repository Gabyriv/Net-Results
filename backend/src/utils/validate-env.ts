"use client";

import { logger } from './logger';

/**
 * Validates that all required environment variables are present
 * This should be run at application startup
 */
export function validateEnv(): void {
  logger.info('Validating environment variables...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingEnvVars.join(', ')}`;
    logger.error(errorMessage);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage);
    } else {
      logger.warn('Application may not function correctly without these environment variables.');
    }
  } else {
    logger.info('All required environment variables are present.');
  }
  
  // Validate database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://')) {
    const errorMessage = 'DATABASE_URL must be a valid PostgreSQL connection string';
    logger.error(errorMessage);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage);
    }
  }
  
  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    const errorMessage = 'NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL';
    logger.error(errorMessage);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage);
    }
  }
}
