import { Router } from 'express';
import { RecipeController } from '../controllers/RecipeController';
import { authenticate } from '../middlewares/authMiddleware';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
const recipeController = new RecipeController();

router.use(authenticate);
router.use(branchGuard);

router.post('/', recipeController.create);
router.get('/', recipeController.list);
router.delete('/:id', recipeController.remove);

export default router;
