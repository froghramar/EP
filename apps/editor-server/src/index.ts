import Koa from 'koa';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import router from './routes';
import { setupMiddleware } from './middleware';
import { WORKSPACE_ROOT, PORT, CORS_ORIGIN_ENV_VALUE, CORS_CREDENTIALS } from './config';
import { getRestrictedFolders } from './utils/restrictedFolders';
import { fileWatcher } from './services/fileWatcher';

const app = new Koa();

// Setup middleware
setupMiddleware(app);

// Register routes
app.use(router.routes());
app.use(router.allowedMethods());

// Error handling
app.on('error', (err, ctx) => {
  console.error('Server error', err);
  ctx.status = 500;
  ctx.body = { error: 'Internal server error' };
});

// Create HTTP server
const server = createServer(app.callback());

// Create WebSocket server
const wss = new WebSocketServer({ 
  noServer: true, // Don't bind to server automatically
  path: '/ws',
});

// Handle HTTP upgrade requests
server.on('upgrade', (request, socket, head) => {
  const pathname = request.url?.split('?')[0]; // Get pathname without query string
  
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    // Let Koa handle other requests or destroy if not a valid upgrade
    socket.destroy();
  }
});

wss.on('connection', (ws, request) => {
  console.log('WebSocket client connected');
  fileWatcher.addClient(ws);
  
  // Send a ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000); // Ping every 30 seconds
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(pingInterval);
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clearInterval(pingInterval);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Workspace root: ${WORKSPACE_ROOT}`);
  console.log(`🌐 CORS origin: ${CORS_ORIGIN_ENV_VALUE}`);
  console.log(`🔐 CORS credentials: ${CORS_CREDENTIALS}`);
  console.log(`🔒 Restricted folders: ${getRestrictedFolders().join(', ')}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}/ws`);
});

