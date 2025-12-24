import Router from '@koa/router';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { isSafePath } from '../../utils/pathUtils';
import { copyRecursive } from '../../utils/fileOperations';

const router = new Router();

// Copy file or folder
router.post('/api/files/copy', async (ctx) => {
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

    if (!isSafePath(destination)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: destination path outside workspace' };
      return;
    }

    // Ensure destination parent directory exists
    const destParentDir = dirname(destination);
    if (!existsSync(destParentDir)) {
      await mkdir(destParentDir, { recursive: true });
    }

    await copyRecursive(sourcePath, destination);
    ctx.body = { success: true, destination };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

