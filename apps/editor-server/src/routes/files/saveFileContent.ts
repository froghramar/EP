import Router from '@koa/router';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { isSafePath, toRelativePath } from '../../utils/pathUtils';
import { isRestrictedPath } from '../../utils/restrictedFolders';
import { fileWatcher } from '../../services/fileWatcher';

const router = new Router();

// Save file content
router.post('/api/files/content', async (ctx) => {
  try {
    const { path: filePath, content } = ctx.request.body as { path: string; content: string };
    
    if (!filePath || content === undefined) {
      ctx.status = 400;
      ctx.body = { error: 'Path and content are required' };
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

    // Ensure directory exists
    const dir = join(filePath, '..');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(filePath, content, 'utf-8');
    
    // Notify file watcher
    const relativePath = toRelativePath(filePath);
    fileWatcher.notifyFileModified(relativePath, content);
    
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

