import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';
import { getLots } from '../controllers/lotController';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

router.get('/', getLots);

export default router;
