import { Router } from 'express';
import { PurchasingController } from '../controllers/PurchasingController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();
const controller = new PurchasingController();

router.use(authenticate);

router.get('/', controller.listPOs.bind(controller));
router.post('/', controller.createPO.bind(controller));
router.post('/:id/approve', controller.approvePO.bind(controller));
router.post('/:id/cancel', controller.cancelPO.bind(controller));

export default router;
