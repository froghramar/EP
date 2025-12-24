import Router from '@koa/router';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { FileNode } from '../../types';
import { WORKSPACE_ROOT } from '../../config';
import { pathToId, isSafePath } from '../../utils/pathUtils';
import { isRestrictedFolder } from '../../utils/restrictedFolders';

const router = new Router();

// Get file tree structure
router.get('/api/files', async (ctx) => {
  try {
    const rootPath = ctx.query.path as string || WORKSPACE_ROOT;
    
    if (!isSafePath(rootPath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: path outside workspace' };
      return;
    }

    const files = await readdir(rootPath);
    const fileNodes: FileNode[] = [];

    for (const file of files) {
      // Skip restricted folders
      if (isRestrictedFolder(file)) {
        continue;
      }

      const filePath = join(rootPath, file);
      const stats = await stat(filePath);
      
      const node: FileNode = {
        id: pathToId(filePath),
        name: file,
        type: stats.isDirectory() ? 'folder' : 'file',
        path: filePath,
      };

      if (stats.isDirectory()) {
        node.children = [];
      }

      fileNodes.push(node);
    }

    ctx.body = fileNodes;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

