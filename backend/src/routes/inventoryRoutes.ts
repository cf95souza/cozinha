import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';

const router = Router();
const inventoryController = new InventoryController();

router.post('/', inventoryController.createSession);
router.post('/:id/items', inventoryController.addItems);
router.put('/:id/approve', inventoryController.approve);
router.get('/', inventoryController.list);
router.delete('/:id', inventoryController.delete);

export default router;
