import { Router } from 'express';
import { ProductionController } from '../controllers/ProductionController';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const productionController = new ProductionController();

router.use(authenticate);
router.use(branchGuard);

router.post('/', productionController.create);
router.get('/', productionController.list);

export default router;
