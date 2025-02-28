import { NextResponse } from "next/server";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { z } from "zod";

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = LoginSchema.parse(body);

        // For testing purposes, we'll bypass Supabase auth and check credentials directly in Prisma
        // This is just for development/testing - in production, you would use Supabase auth
        try {
            const { prisma } = await import("@/config/prisma");
            const bcrypt = await import("bcryptjs");
            
            // Find the user by email
            const user = await prisma.user.findUnique({
                where: { email: validated.email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    displayName: true,
                    role: true
                }
            });
            
            if (!user) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                );
            }
            
            // Check password
            const passwordMatch = await bcrypt.compare(validated.password, user.password);
            
            if (!passwordMatch) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                );
            }
            
            // Create a mock session with the user ID encoded in the token
            const session = {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    user_metadata: {
                        role: user.role,
                        displayName: user.displayName
                    }
                },
                access_token: `mock_token_${user.id}_${Date.now()}`,
                refresh_token: `mock_refresh_${Date.now()}`
            };
            
            // Set auth cookie
            const response = NextResponse.json({ 
                success: true, 
                data: { session, user: session.user } 
            }, { status: 200 });
            
            response.cookies.set('auth_token', session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/'
            });
            
            return response;
        } catch (error) {
            console.error('Login error:', error);
            return handleServerError(error);
        }
    } catch (error) {
        return handleServerError(error);
    }
}
