import { Router } from 'express';
import { TableController } from '../controllers/TableController';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const tableController = new TableController();

router.use(authenticate);
router.use(branchGuard);

router.get('/', (req, res) => tableController.listOpen(req, res));
router.post('/', (req, res) => tableController.openTable(req, res));
router.post('/:id/items', (req, res) => tableController.addItems(req, res));
router.delete('/:id/items/:itemId', (req, res) => tableController.cancelItem(req, res));
router.post('/:id/checkout', (req, res) => tableController.checkout(req, res));

export default router;
