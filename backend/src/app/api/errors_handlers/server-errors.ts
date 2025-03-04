import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

type ErrorResponse = {
    error: string;
    details?: any;
}

export function handleServerError(error: unknown): NextResponse<ErrorResponse> {
    // Ensure error is not null or undefined
    if (!error) {
        return NextResponse.json(
            { error: 'An unknown error occurred' },
            { status: 500 }
        );
    }

    // Log the error safely without trying to stringify it directly
    if (error instanceof Error) {
        console.error('Server error:', error.message);
    } else {
        console.error('Server error: Unknown error type');
    }

    if (error instanceof ZodError) {
        // Handle validation errors
        return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
        );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return NextResponse.json(
                    { error: 'Email already exists' },
                    { status: 409 }
                )
            case 'P2025':
                return NextResponse.json(
                    { error: 'Resource not found' },
                    { status: 404 }
                )
            default:
                return NextResponse.json(
                    { error: 'Database error', details: error.message },
                    { status: 500 }
                )
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json(
            { error: 'Invalid data format' },
            { status: 400 }
        )
    }

    // Handle other types of errors
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
    );
} 