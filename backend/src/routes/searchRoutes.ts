import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const searchController = new SearchController();

router.use(authenticate);
router.use(branchGuard);
router.get('/', searchController.search);

export default router;
