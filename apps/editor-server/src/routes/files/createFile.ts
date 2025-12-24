import Router from '@koa/router';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { existsSync } from 'fs';
import { isSafePath } from '../../utils/pathUtils';
import { isRestrictedPath } from '../../utils/restrictedFolders';

const router = new Router();

// Create file or folder
router.post('/api/files/create', async (ctx) => {
  try {
    const { path: filePath, type, content } = ctx.request.body as { 
      path: string; 
      type: 'file' | 'folder';
      content?: string;
    };
    
    if (!filePath || !type) {
      ctx.status = 400;
      ctx.body = { error: 'Path and type are required' };
      return;
    }

    if (!isSafePath(filePath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: path outside workspace' };
      return;
    }

    if (isRestrictedPath(filePath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: cannot modify restricted folders via file APIs' };
      return;
    }

    // Ensure parent directory exists
    const parentDir = dirname(filePath);
    if (!existsSync(parentDir)) {
      await mkdir(parentDir, { recursive: true });
    }

    if (type === 'folder') {
      await mkdir(filePath, { recursive: true });
    } else {
      // Create file with optional content
      await writeFile(filePath, content || '', 'utf-8');
    }

    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

