import { NextApiRequest } from 'next';
import { parse } from 'cookie';

/**
 * Extract the authentication token from the request
 * Checks both the Authorization header and cookies
 */
export function getTokenFromRequest(req: NextApiRequest): string | null {
    try {
        // First try to get token from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // If no Authorization header, try to get from cookies
        const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
        if (cookies.auth_token) {
            return cookies.auth_token;
        }

        // Finally, check if token is in the request body
        if (req.body?.token) {
            return req.body.token;
        }

        return null;
    } catch (error) {
        console.error('Error extracting token:', error);
        return null;
    }
}
