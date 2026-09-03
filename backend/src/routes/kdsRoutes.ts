import { Router } from 'express';
import { KdsController } from '../controllers/KdsController';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const kdsController = new KdsController();

router.use(authenticate);
router.use(branchGuard);

router.get('/', (req, res) => kdsController.listActive(req, res));
router.patch('/:itemId/status', (req, res) => kdsController.updateItemStatus(req, res));

export default router;
