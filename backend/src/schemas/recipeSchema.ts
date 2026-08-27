import { z } from 'zod';

export const recipeItemSchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.number().min(0.01)
});

export const createRecipeSchema = z.object({
  productId: z.string().uuid(),
  branchId: z.string().uuid(),
  expectedYield: z.number().min(0.01),
  preparationTime: z.number().optional().nullable(),
  instructions: z.string().optional().nullable(),
  items: z.array(recipeItemSchema).min(1)
});

export const updateRecipeSchema = createRecipeSchema.partial();
