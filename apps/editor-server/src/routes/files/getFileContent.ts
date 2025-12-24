import Router from '@koa/router';
import { stat, readFile } from 'fs/promises';
import { isSafePath } from '../../utils/pathUtils';

const router = new Router();

// Get file content
router.get('/api/files/content', async (ctx) => {
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
      ctx.status = 400;
      ctx.body = { error: 'Path is a directory, not a file' };
      return;
    }

    const content = await readFile(filePath, 'utf-8');
    ctx.body = { content };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

