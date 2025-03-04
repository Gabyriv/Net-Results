import { NextResponse } from "next/server"
import { ZodError, ZodIssue } from "zod"
import { Prisma } from "@prisma/client"

type ErrorResponse = {
    error: string;
    details?: ZodIssue[] | string;
}

export function handleServerError(error: unknown): NextResponse<ErrorResponse> {
    console.error('Server error:', error)

    if (error instanceof ZodError) {
        return NextResponse.json(
            { 
                error: 'Validation error',
                details: error.errors 
            },
            { status: 400 }
        )
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

    return NextResponse.json(
        { error: 'Internal Server Error', details: (error as Error).message },
        { status: 500 }
    )
} 