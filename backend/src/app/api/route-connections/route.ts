import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Return a meaningful response
  return NextResponse.json({ 
    message: 'Connection to backend API successful!',
    status: 'online',
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD',
    }
  });
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
} 