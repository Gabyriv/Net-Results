// Custom Next.js server with environment validation and production enhancements
const { createServer } = 'http';
const { parse } = 'url';
const next = 'next';

// Determine the environment
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Prepare the app
app.prepare().then(() => {
  // Create the HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Add security headers for all responses
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Add CORS headers for API routes
      if (req.url.startsWith('/api/')) {
        // Allow CORS for API routes
        const origin = req.headers.origin || '';
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173',
          process.env.FRONTEND_URL || '',
        ].filter(Boolean);
        
        // In production, only allow specific origins
        const allowOrigin = process.env.NODE_ENV === 'production'
          ? (allowedOrigins.includes(origin) ? origin : allowedOrigins[0])
          : origin || '*';
          
        res.setHeader('Access-Control-Allow-Origin', allowOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
      }
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  
  // Start the server
  server.listen(port, (err) => {
    if (err) throw err;
    
    // Load environment validation in a non-blocking way
    if (!dev) {
      try {
        // In production, we need to require the compiled JS file
        './dist/utils/validate-env'.validateEnv();
        console.log('✅ Environment validation passed');
      } catch (error) {
        console.error('❌ Environment validation failed:', error);
        process.exit(1);
      }
    }
    
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
