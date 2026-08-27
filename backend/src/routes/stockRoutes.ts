import { Router } from 'express';
import { getStockBalances, transferStock } from '../controllers/stockController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

router.get('/balances', requireRole(['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO']), getStockBalances);
router.post('/transfer', requireRole(['ADMIN', 'GESTOR', 'ESTOQUISTA']), transferStock);

export default router;
