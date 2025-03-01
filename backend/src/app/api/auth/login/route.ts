import { NextResponse } from "next/server";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { z } from "zod";

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = LoginSchema.parse(body);

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
                access_token: `${user.id}_${Date.now()}`,
                refresh_token: `${Date.now()}`
            };
            
            // Set auth cookie and also return token for frontend storage
            const response = NextResponse.json({ 
                success: true, 
                data: { 
                    session, 
                    user: session.user,
                    token: session.access_token 
                } 
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
