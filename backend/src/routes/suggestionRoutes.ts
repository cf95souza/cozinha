import { Router } from 'express';
import { getPurchaseSuggestions } from '../controllers/suggestionController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

router.get('/purchase', requireRole(['ADMIN', 'GESTOR', 'ESTOQUISTA']), getPurchaseSuggestions);

export default router;
