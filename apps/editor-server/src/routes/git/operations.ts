import Router from '@koa/router';
import {
  isGitRepository,
  getDiff,
  stageFiles,
  unstageFiles,
  commit,
  getLog,
  discardChanges,
} from '../../utils/gitUtils';

const router = new Router();

// Get file diff
router.get('/api/git/diff', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const filePath = ctx.query.path as string;
    const cached = ctx.query.cached === 'true';

    if (!filePath) {
      ctx.status = 400;
      ctx.body = { error: 'Path parameter is required' };
      return;
    }

    const diff = await getDiff(filePath, cached);
    ctx.body = { diff };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Stage files
router.post('/api/git/stage', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const { files } = ctx.request.body as { files: string[] };

    if (!files || !Array.isArray(files) || files.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Files array is required' };
      return;
    }

    await stageFiles(files);
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Unstage files
router.post('/api/git/unstage', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const { files } = ctx.request.body as { files: string[] };

    if (!files || !Array.isArray(files) || files.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Files array is required' };
      return;
    }

    await unstageFiles(files);
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Commit changes
router.post('/api/git/commit', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const { message } = ctx.request.body as { message: string };

    if (!message || !message.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'Commit message is required' };
      return;
    }

    const commitHash = await commit(message);
    ctx.body = { success: true, commit: commitHash };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get commit log
router.get('/api/git/log', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const maxCount = parseInt(ctx.query.maxCount as string || '50', 10);
    const log = await getLog(maxCount);

    ctx.body = {
      commits: log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        author_email: commit.author_email,
      })),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Discard changes
router.post('/api/git/discard', async (ctx) => {
  try {
    const isRepo = await isGitRepository();
    if (!isRepo) {
      ctx.status = 400;
      ctx.body = { error: 'Not a git repository' };
      return;
    }

    const { files } = ctx.request.body as { files: string[] };

    if (!files || !Array.isArray(files) || files.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Files array is required' };
      return;
    }

    await discardChanges(files);
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;

