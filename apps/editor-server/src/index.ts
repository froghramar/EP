import Koa from 'koa';
import router from './routes';
import { setupMiddleware } from './middleware';
import { WORKSPACE_ROOT, PORT, CORS_ORIGIN_ENV_VALUE, CORS_CREDENTIALS } from './config';
import { getRestrictedFolders } from './utils/restrictedFolders';

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Workspace root: ${WORKSPACE_ROOT}`);
  console.log(`🌐 CORS origin: ${CORS_ORIGIN_ENV_VALUE}`);
  console.log(`🔐 CORS credentials: ${CORS_CREDENTIALS}`);
  console.log(`🔒 Restricted folders: ${getRestrictedFolders().join(', ')}`);
});

