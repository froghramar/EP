import Router from '@koa/router';
import { rename } from 'fs/promises';
import { dirname, join } from 'path';
import { isSafePath } from '../../utils/pathUtils';

const router = new Router();

// Rename file or folder
router.patch('/api/files/rename', async (ctx) => {
  try {
    const { path: filePath, newName } = ctx.request.body as { 
      path: string; 
      newName: string;
    };
    
    if (!filePath || !newName) {
      ctx.status = 400;
      ctx.body = { error: 'Path and newName are required' };
      return;
    }

    if (!isSafePath(filePath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: path outside workspace' };
      return;
    }

    const parentDir = dirname(filePath);
    const newPath = join(parentDir, newName);

    if (!isSafePath(newPath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: new path outside workspace' };
      return;
    }

    await rename(filePath, newPath);
    ctx.body = { success: true, newPath };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

