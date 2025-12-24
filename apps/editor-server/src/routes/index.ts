import Router from '@koa/router';
import filesRouter from './files';

const router = new Router();

// Register all route modules
router.use(filesRouter.routes());
router.use(filesRouter.allowedMethods());

export default router;

