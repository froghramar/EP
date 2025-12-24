import Router from '@koa/router';
import listFilesRouter from './listFiles';
import getFileContentRouter from './getFileContent';
import saveFileContentRouter from './saveFileContent';
import getFileTreeRouter from './getFileTree';

const router = new Router();

// Register all file-related routes
router.use(listFilesRouter.routes());
router.use(listFilesRouter.allowedMethods());

router.use(getFileContentRouter.routes());
router.use(getFileContentRouter.allowedMethods());

router.use(saveFileContentRouter.routes());
router.use(saveFileContentRouter.allowedMethods());

router.use(getFileTreeRouter.routes());
router.use(getFileTreeRouter.allowedMethods());

export default router;

