import { NextResponse } from "next/server";
import { withAuth } from "../../../utils/auth-utils";

export async function POST(request: Request) {
    return withAuth(request, async (session) => {
        try {
            const body = await request.json();
            return NextResponse.json({ 
                success: true, 
                receivedBody: body,
                bodyType: typeof body,
                isObject: body !== null && typeof body === 'object',
                hasNameProperty: body !== null && typeof body === 'object' && 'name' in body,
                namePropertyType: body !== null && typeof body === 'object' && 'name' in body ? typeof body.name : 'not present',
                headers: Object.fromEntries(request.headers),
                session: {
                    userId: session.userId,
                    userEmail: session.userEmail,
                    userRole: session.userRole,
                    userMetadata: session.userMetadata
                }
            }, { status: 200 });
        } catch (error) {
            return NextResponse.json({ 
                error: 'Error parsing request', 
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }, { status: 400 });
        }
    });
}
