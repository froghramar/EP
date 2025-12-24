import Router from '@koa/router';
import { dirname, join, basename } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { isSafePath } from '../../utils/pathUtils';
import { copyRecursive } from '../../utils/fileOperations';
import { isRestrictedPath } from '../../utils/restrictedFolders';

const router = new Router();

// Bulk copy files and folders
router.post('/api/files/bulk/copy', async (ctx) => {
  try {
    const { paths, destination } = ctx.request.body as { 
      paths: string[];
      destination: string;
    };
    
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Paths array is required and must not be empty' };
      return;
    }

    if (!destination) {
      ctx.status = 400;
      ctx.body = { error: 'Destination is required' };
      return;
    }

    if (!isSafePath(destination)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: destination path outside workspace' };
      return;
    }

    if (isRestrictedPath(destination)) {
      ctx.status = 403;
      ctx.body = { error: 'Access denied: cannot modify restricted folders' };
      return;
    }

    // Ensure destination directory exists
    if (!existsSync(destination)) {
      await mkdir(destination, { recursive: true });
    }

    const results: Array<{ path: string; destination: string; success: boolean; error?: string }> = [];

    for (const sourcePath of paths) {
      try {
        if (!isSafePath(sourcePath)) {
          results.push({
            path: sourcePath,
            destination: '',
            success: false,
            error: 'Access denied: source path outside workspace',
          });
          continue;
        }

        if (isRestrictedPath(sourcePath)) {
          results.push({
            path: sourcePath,
            destination: '',
            success: false,
            error: 'Access denied: cannot modify restricted folders',
          });
          continue;
        }

        const fileName = basename(sourcePath);
        const destPath = join(destination, fileName);

        if (!isSafePath(destPath)) {
          results.push({
            path: sourcePath,
            destination: destPath,
            success: false,
            error: 'Access denied: destination path outside workspace',
          });
          continue;
        }

        // Ensure destination parent directory exists
        const destParentDir = dirname(destPath);
        if (!existsSync(destParentDir)) {
          await mkdir(destParentDir, { recursive: true });
        }

        await copyRecursive(sourcePath, destPath);
        results.push({ path: sourcePath, destination: destPath, success: true });
      } catch (error) {
        results.push({
          path: sourcePath,
          destination: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const allSuccess = results.every(r => r.success);
    ctx.status = allSuccess ? 200 : 207; // 207 Multi-Status for partial success
    ctx.body = { results, success: allSuccess };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

