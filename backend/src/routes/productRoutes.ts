import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { getProductHistory } from '../controllers/productDetailController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

router.get('/:id/history', requireRole(['ADMIN', 'GESTOR', 'ESTOQUISTA']), getProductHistory);
router.get('/', requireRole(['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO']), getProducts);
router.post('/', requireRole(['ADMIN', 'GESTOR']), createProduct);
router.put('/:id', requireRole(['ADMIN', 'GESTOR']), updateProduct);
router.delete('/:id', requireRole(['ADMIN']), deleteProduct);

export default router;
