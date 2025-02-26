import { NextResponse } from "next/server";
import supabase from "@/config/supabase_client";
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
        const { error: authError } = await supabase.auth.signOut();

        if (authError) {
            return handleServerError(authError);
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return handleServerError(error);
    }
}
