import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

type ErrorResponse = {
    error: string;
    details?: any;
}

/**
 * Handle server errors and return appropriate JSON responses
 * @param error - The error object
 * @returns NextResponse with appropriate status code and error message
 */
export function handleServerError(error: unknown): NextResponse {
    // Ensure we have a non-null error object to work with
    if (error === null || error === undefined) {
        return NextResponse.json(
            { error: "Unknown server error occurred" } as ErrorResponse,
            { status: 500 }
        );
    }

    // Safely log the error, avoiding direct console.error on the error object
    // which can cause issues with null payload serialization
    if (error instanceof Error) {
        console.log(`Server error: ${error.name} - ${error.message}`);
    } else {
        console.log(`Unknown server error type occurred`);
    }

    // Handle specific error types
    if (error instanceof ZodError) {
        // Validation error
        return NextResponse.json(
            { error: "Validation error", details: error.format() } as ErrorResponse,
            { status: 400 }
        );
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Prisma known error (e.g. unique constraint violation)
        let errorMessage = "Database error";
        
        // Handle common Prisma error codes
        if (error.code === "P2002") {
            errorMessage = "A record with this value already exists";
        } else if (error.code === "P2025") {
            errorMessage = "Record not found";
        }
        
        return NextResponse.json(
            { 
                error: errorMessage, 
                details: { 
                    code: error.code, 
                    meta: error.meta 
                } 
            } as ErrorResponse,
            { status: 400 }
        );
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        // Prisma validation error
        return NextResponse.json(
            { error: "Invalid data format for database operation" } as ErrorResponse,
            { status: 400 }
        );
    } else if (error instanceof Error) {
        // Generic error with message
        return NextResponse.json(
            { error: error.message || "Server error occurred" } as ErrorResponse,
            { status: 500 }
        );
    } else {
        // Unknown error type
        return NextResponse.json(
            { error: "Unknown server error occurred" } as ErrorResponse,
            { status: 500 }
        );
    }
} 