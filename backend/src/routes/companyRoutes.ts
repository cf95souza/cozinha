import { Router } from 'express';
import { getCompany, updateCompany } from '../controllers/companyController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

// Apenas o ADMIN pode editar a empresa
router.get('/', getCompany);
router.put('/', requireRole(['ADMIN']), updateCompany);

export default router;
