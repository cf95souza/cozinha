import { Router } from 'express';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/locationController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();

router.use(authenticate);
router.use(branchGuard);

router.get('/', requireRole(['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO']), getLocations);
router.post('/', requireRole(['ADMIN', 'GESTOR']), createLocation);
router.put('/:id', requireRole(['ADMIN', 'GESTOR']), updateLocation);
router.delete('/:id', requireRole(['ADMIN']), deleteLocation);

export default router;
