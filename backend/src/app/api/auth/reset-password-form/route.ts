import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Read the HTML file
    const filePath = path.join(process.cwd(), 'backend', 'pages', 'api', 'auth', 'reset-password-form.html');
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    
    // Create response with HTML content
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error serving reset password form:', error);
    return NextResponse.json({ error: 'Failed to serve form' }, { status: 500 });
  }
} 