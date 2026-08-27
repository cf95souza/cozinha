import { Router } from 'express';
import { getUsers, createUser, deleteUser } from '../controllers/userController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);
// Apenas ADMIN e GESTOR podem gerenciar usuários (com restrições extras no controller)
router.use(requireRole(['ADMIN', 'GESTOR']));

router.get('/', getUsers);
router.post('/', createUser);
router.delete('/:id', deleteUser);

export default router;
