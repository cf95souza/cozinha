import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';
import {
  getReceivings,
  createReceiving,
  getReceivingById,
  updateReceivingItem,
  approveReceiving
} from '../controllers/receivingController';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

router.get('/', getReceivings);
router.post('/', createReceiving);
router.get('/:id', getReceivingById);
router.put('/:id/items/:itemId', updateReceivingItem);
router.post('/:id/approve', approveReceiving);

export default router;
