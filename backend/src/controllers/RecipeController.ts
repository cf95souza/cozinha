import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NutritionService } from '../services/NutritionService';

const nutritionService = new NutritionService();

export class RecipeController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { productId, expectedYield, preparationTime, instructions, items } = req.body;
      const branchId = req.user?.branchId;

      if (!branchId) return res.status(400).json({ error: 'BranchId is required' });
      if (!productId || !expectedYield || !items || !items.length) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const recipe = await prisma.recipe.create({
        data: {
          productId,
          branchId,
          expectedYield: Number(expectedYield),
          preparationTime: preparationTime ? Number(preparationTime) : null,
          instructions,
          items: {
            create: items.map((item: any) => ({
              ingredientId: item.ingredientId,
              quantity: Number(item.quantity)
            }))
          }
        },
        include: { items: { include: { ingredient: true } }, product: true }
      });

      return res.status(201).json(recipe);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branchId;
      const recipes = await prisma.recipe.findMany({
        where: branchId ? { branchId } : {},
        include: { product: true, items: { include: { ingredient: true } } },
        orderBy: { product: { name: 'asc' } }
      });
      
      const recipesWithNutrition = await Promise.all(recipes.map(async (recipe) => {
         const nutrition = await nutritionService.calculateNutritionFromObject(recipe);
         return {
           ...recipe,
           nutrition
         };
      }));

      return res.status(200).json(recipesWithNutrition);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async remove(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      await prisma.recipe.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
