import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the HTML file
    const filePath = path.join(process.cwd(), 'pages', 'api', 'auth', 'reset-password-form.html');
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    
    // Set the content type and send the HTML
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error('Error serving reset password form:', error);
    res.status(500).json({ error: 'Failed to serve form' });
  }
}
