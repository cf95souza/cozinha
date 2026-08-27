import { Router } from 'express';
import { SaleController } from '../controllers/SaleController';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const saleController = new SaleController();

router.use(authenticate);

router.post('/', branchGuard, saleController.create);
router.get('/', branchGuard, saleController.list);

export default router;
