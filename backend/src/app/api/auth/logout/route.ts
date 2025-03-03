import { NextResponse } from "next/server";
import { handleServerError } from "@/app/api/errors_handlers/errors";

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: User logout
 *     description: Signs out the currently authenticated user
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST() {
    try {
        // For testing purposes, we'll just clear the auth cookie
        // This is just for development/testing - in production, you would use Supabase auth
        const response = NextResponse.json({ success: true }, { status: 200 });
        
        response.cookies.set('auth_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // Expire immediately
            path: '/'
        });
        
        return response;
        
        /* Original Supabase auth code
        const { error } = await supabase.auth.signOut();

        if (error) {
            return handleServerError(error);
        }

        return NextResponse.json({ success: true }, { status: 200 });
        */
    } catch (error) {
        return handleServerError(error);
    }
}
