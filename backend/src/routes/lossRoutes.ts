import { Router } from 'express';
import { LossController } from '../controllers/LossController';

const router = Router();
const lossController = new LossController();

router.post('/', lossController.create);
router.get('/', lossController.list);

export default router;
