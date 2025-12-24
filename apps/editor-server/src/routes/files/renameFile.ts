import Router from '@koa/router';
import { rename } from 'fs/promises';
import { dirname, join } from 'path';
import { isSafePath, toRelativePath } from '../../utils/pathUtils';
import { isRestrictedPath } from '../../utils/restrictedFolders';
import { fileWatcher } from '../../services/fileWatcher';

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

    if (isRestrictedPath(filePath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: cannot modify restricted folders via file APIs' };
      return;
    }

    const parentDir = dirname(filePath);
    const newPath = join(parentDir, newName);

    if (!isSafePath(newPath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: new path outside workspace' };
      return;
    }

    if (isRestrictedPath(newPath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: cannot modify restricted folders via file APIs' };
      return;
    }

    await rename(filePath, newPath);
    
    // Notify file watcher
    const oldRelativePath = toRelativePath(filePath);
    const newRelativePath = toRelativePath(newPath);
    fileWatcher.notifyFileRenamed(oldRelativePath, newRelativePath);
    
    ctx.body = { success: true, newPath };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

