import { Router } from 'express';
import { QuotationController } from '../controllers/QuotationController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();
const controller = new QuotationController();

router.use(authenticate);

router.post('/', controller.saveQuotations.bind(controller));
router.get('/history/:productId', controller.getPriceHistory.bind(controller));

export default router;
