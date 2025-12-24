import Router from '@koa/router';
import filesRouter from './files';
import gitRouter from './git';

const router = new Router();

// Register all route modules
router.use(filesRouter.routes());
router.use(filesRouter.allowedMethods());

router.use(gitRouter.routes());
router.use(gitRouter.allowedMethods());

export default router;

