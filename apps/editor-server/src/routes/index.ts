import Router from '@koa/router';
import filesRouter from './files';
import gitRouter from './git';
import chatRouter from './chat';
import wordpressRouter from './wordpress';

const router = new Router();

// Register all route modules
router.use(filesRouter.routes());
router.use(filesRouter.allowedMethods());

router.use(gitRouter.routes());
router.use(gitRouter.allowedMethods());

router.use(chatRouter.routes());
router.use(chatRouter.allowedMethods());

router.use(wordpressRouter.routes());
router.use(wordpressRouter.allowedMethods());

export default router;

