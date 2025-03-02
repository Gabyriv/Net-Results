"use client";

import { NextResponse } from "next/server";
import { handleServerError } from "./errors_handlers/errors";
import { logger } from "@/utils/logger";

/**
 * Higher-order function to wrap API route handlers with error handling
 * This ensures consistent error handling across all API routes
 * 
 * @param handler The API route handler function to wrap
 * @returns A wrapped handler function with error handling
 */
export function withErrorHandling(handler: (request: Request) => Promise<NextResponse>) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      // Execute the original handler
      return await handler(request);
    } catch (error) {
      // Log the error
      logger.error("Unhandled API error", {
        path: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Handle the error and return an appropriate response
      return handleServerError(error);
    }
  };
}
