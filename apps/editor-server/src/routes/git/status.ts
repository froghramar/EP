import Router from '@koa/router';
import { isGitRepository, getStatus, getCurrentBranch, initRepository } from '../../utils/gitUtils';

const router = new Router();

// Check if workspace is a git repository
router.get('/api/git/check', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    ctx.body = { isGitRepository: isRepo };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Initialize a new git repository
router.post('/api/git/init', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Already a git repository' };
      return;
    }

    await initRepository();
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get git status
router.get('/api/git/status', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const [status, branch] = await Promise.all([
      getStatus(),
      getCurrentBranch(),
    ]);

    ctx.body = {
      branch,
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
      renamed: status.renamed,
      staged: status.staged,
      conflicted: status.conflicted,
      not_added: status.not_added,
      isClean: status.isClean(),
      ahead: status.ahead,
      behind: status.behind,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

