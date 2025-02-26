import { NextRequest, NextResponse } from "next/server";
import { 
  runTestPost, 
  runTestGet, 
  resetMockDb 
} from "../../users/test-route";

/**
 * Test endpoint to test the users API without affecting the real database
 * This is for testing purposes only and should not be used in production
 */
export async function POST(request: NextRequest) {
  try {
    const { action, userData, asAdmin } = await request.json();
    
    switch (action) {
      case 'create':
        return runTestPost(userData);
        
      case 'getAll':
        return runTestGet(asAdmin);
        
      case 'reset':
        const result = resetMockDb();
        return NextResponse.json(result);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "create", "getAll", or "reset".' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Test execution failed', details: String(error) },
      { status: 500 }
    );
  }
}
