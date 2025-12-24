import Router from '@koa/router';
import statusRouter from './status';
import operationsRouter from './operations';
import branchesRouter from './branches';

const router = new Router();

// Register all git routes
router.use(statusRouter.routes());
router.use(statusRouter.allowedMethods());

router.use(operationsRouter.routes());
router.use(operationsRouter.allowedMethods());

router.use(branchesRouter.routes());
router.use(branchesRouter.allowedMethods());

export default router;

