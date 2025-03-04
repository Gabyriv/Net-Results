import { NextResponse } from "next/server";
import { handleServerError } from "./errors_handlers/server-errors";
import { logger } from "@/utils/server-logger";

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
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Unhandled API error", errorObj, {
        requestUrl: request.url,
        method: request.method
      });
      
      // Handle the error and return an appropriate response
      return handleServerError(error);
    }
  };
}
