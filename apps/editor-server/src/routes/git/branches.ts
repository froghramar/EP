import Router from '@koa/router';
import {
  isGitRepository,
  getBranches,
  checkoutBranch,
  createBranch,
  pull,
  push,
} from '../../utils/gitUtils';

const router = new Router();

// Get branches
router.get('/api/git/branches', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const branches = await getBranches();
    ctx.body = branches;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Checkout branch
router.post('/api/git/checkout', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const { branch } = ctx.request.body as { branch: string };

    if (!branch || !branch.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'Branch name is required' };
      return;
    }

    await checkoutBranch(branch);
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Create branch
router.post('/api/git/branch', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const { name, checkout } = ctx.request.body as { name: string; checkout?: boolean };

    if (!name || !name.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'Branch name is required' };
      return;
    }

    await createBranch(name, checkout);
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Pull changes
router.post('/api/git/pull', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    await pull();
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Push changes
router.post('/api/git/push', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const { branch } = ctx.request.body as { branch?: string };

    await push(branch);
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

