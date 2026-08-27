import { Router } from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

router.get('/', requireRole(['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO']), getSuppliers);
router.post('/', requireRole(['ADMIN', 'GESTOR']), createSupplier);
router.put('/:id', requireRole(['ADMIN', 'GESTOR']), updateSupplier);
router.delete('/:id', requireRole(['ADMIN']), deleteSupplier);

export default router;
