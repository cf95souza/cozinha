import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticate);
router.use(branchGuard);
router.get('/kpis', dashboardController.getKpis);

export default router;
