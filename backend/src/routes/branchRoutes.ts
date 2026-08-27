import { Router } from 'express';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branchController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

// Listagem pode ser vista por ADMIN e GESTOR
router.get('/', requireRole(['ADMIN', 'GESTOR']), getBranches);

// Apenas ADMIN pode criar, atualizar ou excluir unidades
router.post('/', requireRole(['ADMIN']), createBranch);
router.put('/:id', requireRole(['ADMIN']), updateBranch);
router.delete('/:id', requireRole(['ADMIN']), deleteBranch);

export default router;
