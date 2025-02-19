import { NextResponse } from "next/server";
import supabase from "@/config/supabase_client";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { z } from "zod";

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
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
 *                 minLength: 8
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

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: validated.email,
            password: validated.password,
        });

        if (authError) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        return NextResponse.json({ success: true, data: authData }, { status: 200 });
    } catch (error) {
        return handleServerError(error);
    }
}
