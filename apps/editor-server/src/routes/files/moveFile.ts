import Router from '@koa/router';
import { rename } from 'fs/promises';
import { dirname } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { isSafePath } from '../../utils/pathUtils';
import { isRestrictedPath } from '../../utils/restrictedFolders';

const router = new Router();

// Move file or folder
router.post('/api/files/move', async (ctx) => {
  try {
    const { path: sourcePath, destination } = ctx.request.body as { 
      path: string; 
      destination: string;
    };
    
    if (!sourcePath || !destination) {
      ctx.status = 400;
      ctx.body = { error: 'Path and destination are required' };
      return;
    }

    if (!isSafePath(sourcePath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: source path outside workspace' };
      return;
    }

    if (isRestrictedPath(sourcePath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: cannot modify restricted folders via file APIs' };
      return;
    }

    if (!isSafePath(destination)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: destination path outside workspace' };
      return;
    }

    if (isRestrictedPath(destination)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: cannot modify restricted folders via file APIs' };
      return;
    }

    // Ensure destination parent directory exists
    const destParentDir = dirname(destination);
    if (!existsSync(destParentDir)) {
      await mkdir(destParentDir, { recursive: true });
    }

    await rename(sourcePath, destination);
    ctx.body = { success: true, destination };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

