import Router from '@koa/router';
import { unlink, rm, stat } from 'fs/promises';
import { isSafePath } from '../../utils/pathUtils';
import { isRestrictedPath } from '../../utils/restrictedFolders';

const router = new Router();

// Bulk delete files and folders
router.post('/api/files/bulk/delete', async (ctx) => {
  try {
    const { paths } = ctx.request.body as { paths: string[] };
    
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Paths array is required and must not be empty' };
      return;
    }

    const results: Array<{ path: string; success: boolean; error?: string }> = [];

    for (const filePath of paths) {
      try {
        if (!isSafePath(filePath)) {
          results.push({
            path: filePath,
            success: false,
            error: 'Access denied: path outside workspace',
          });
          continue;
        }

        if (isRestrictedPath(filePath)) {
          results.push({
            path: filePath,
            success: false,
            error: 'Access denied: cannot modify restricted folders',
          });
          continue;
        }

        const stats = await stat(filePath);
        
        if (stats.isDirectory()) {
          await rm(filePath, { recursive: true, force: true });
        } else {
          await unlink(filePath);
        }

        results.push({ path: filePath, success: true });
      } catch (error) {
        results.push({
          path: filePath,
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

