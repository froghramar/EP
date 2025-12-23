import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { readdir, stat, readFile, writeFile, mkdir } from 'fs/promises';
import { join, resolve, normalize } from 'path';
import { existsSync } from 'fs';

const app = new Koa();
const router = new Router();

// File explorer API endpoints

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}

// Get the workspace root directory (adjust as needed)
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();

// Helper function to generate a unique ID from path
function pathToId(path: string): string {
  return Buffer.from(path).toString('base64url');
}

// Helper function to check if path is safe (within workspace)
function isSafePath(filePath: string): boolean {
  const resolved = resolve(WORKSPACE_ROOT, normalize(filePath));
  return resolved.startsWith(resolve(WORKSPACE_ROOT));
}

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

    // Ensure directory exists
    const dir = join(filePath, '..');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(filePath, content, 'utf-8');
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

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

// Middleware
app.use(cors({
  origin: '*', // In production, specify allowed origins
  credentials: true,
}));

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

// Error handling
app.on('error', (err, ctx) => {
  console.error('Server error', err);
  ctx.status = 500;
  ctx.body = { error: 'Internal server error' };
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Workspace root: ${WORKSPACE_ROOT}`);
});

