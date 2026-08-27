import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

router.get('/', requireRole(['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO']), getCategories);
router.post('/', requireRole(['ADMIN', 'GESTOR']), createCategory);
router.put('/:id', requireRole(['ADMIN', 'GESTOR']), updateCategory);
router.delete('/:id', requireRole(['ADMIN']), deleteCategory);

export default router;
