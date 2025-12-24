import Router from '@koa/router';
import listFilesRouter from './listFiles';
import getFileContentRouter from './getFileContent';
import saveFileContentRouter from './saveFileContent';
import getFileTreeRouter from './getFileTree';
import createFileRouter from './createFile';
import deleteFileRouter from './deleteFile';
import renameFileRouter from './renameFile';
import copyFileRouter from './copyFile';
import moveFileRouter from './moveFile';
import bulkDeleteRouter from './bulkDelete';
import bulkCopyRouter from './bulkCopy';
import bulkMoveRouter from './bulkMove';

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

router.use(createFileRouter.routes());
router.use(createFileRouter.allowedMethods());

router.use(deleteFileRouter.routes());
router.use(deleteFileRouter.allowedMethods());

router.use(renameFileRouter.routes());
router.use(renameFileRouter.allowedMethods());

router.use(copyFileRouter.routes());
router.use(copyFileRouter.allowedMethods());

router.use(moveFileRouter.routes());
router.use(moveFileRouter.allowedMethods());

router.use(bulkDeleteRouter.routes());
router.use(bulkDeleteRouter.allowedMethods());

router.use(bulkCopyRouter.routes());
router.use(bulkCopyRouter.allowedMethods());

router.use(bulkMoveRouter.routes());
router.use(bulkMoveRouter.allowedMethods());

export default router;

