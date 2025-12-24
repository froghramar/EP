import Router from '@koa/router';
import { unlink, rm, stat } from 'fs/promises';
import { isSafePath } from '../../utils/pathUtils';

const router = new Router();

// Delete file or folder
router.delete('/api/files', async (ctx) => {
  try {
    const filePath = ctx.query.path as string;
    
    if (!filePath) {
      ctx.status = 400;
      ctx.body = { error: 'Path parameter is required' };
      return;
    }

    if (!isSafePath(filePath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: path outside workspace' };
      return;
    }

    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      // Remove directory recursively
      await rm(filePath, { recursive: true, force: true });
    } else {
      // Remove file
      await unlink(filePath);
    }

    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

