import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const reportController = new ReportController();

router.use(authenticate);
router.use(branchGuard);

router.get('/stock', reportController.getStock);
router.get('/movements', reportController.getMovements);
router.get('/losses', reportController.getLosses);
router.get('/expirations', reportController.getExpirations);
router.get('/receivings', reportController.getReceivings);
router.get('/cmv', reportController.getCmv);
router.get('/abc', reportController.getAbcCurve);
router.get('/inventories', reportController.getInventories);
router.get('/productions', reportController.getProductions);

export default router;
