import Router from '@koa/router';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { FileNode } from '../../types';
import { WORKSPACE_ROOT } from '../../config';
import { pathToId, isSafePath } from '../../utils/pathUtils';

const router = new Router();

// Get single file node with children (recursive)
router.get('/api/files/tree', async (ctx) => {
  try {
    const rootPath = ctx.query.path as string || WORKSPACE_ROOT;
    const maxDepth = parseInt(ctx.query.maxDepth as string || '3', 10);

    if (!isSafePath(rootPath)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: path outside workspace' };
      return;
    }

    async function buildTree(path: string, depth: number): Promise<FileNode | null> {
      if (depth > maxDepth) return null;

      const stats = await stat(path);
      const name = path.split(/[/\\]/).pop() || path;
      
      const node: FileNode = {
        id: pathToId(path),
        name,
        type: stats.isDirectory() ? 'folder' : 'file',
        path,
      };

      if (stats.isDirectory()) {
        const children: FileNode[] = [];
        const entries = await readdir(path);
        
        for (const entry of entries) {
          const entryPath = join(path, entry);
          if (!isSafePath(entryPath)) continue;
          
          try {
            const childNode = await buildTree(entryPath, depth + 1);
            if (childNode) {
              children.push(childNode);
            }
          } catch {
            // Skip files we can't read
          }
        }

        node.children = children;
      }

      return node;
    }

    const tree = await buildTree(rootPath, 0);
    ctx.body = tree;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

