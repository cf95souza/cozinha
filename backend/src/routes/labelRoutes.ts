import { Router } from 'express';
import { LabelController } from '../controllers/LabelController';

const router = Router();
const labelController = new LabelController();

router.post('/', labelController.create);
router.get('/:qrCode', labelController.findByQrCode);

export default router;
