import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const auditController = new AuditController();

router.use(authenticate);
router.use(branchGuard);
router.get('/', requireRole(['ADMIN', 'GESTOR']), auditController.list);

export default router;
