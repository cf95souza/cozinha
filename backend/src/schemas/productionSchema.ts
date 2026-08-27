import { z } from 'zod';

export const productionIngredientSchema = z.object({
  ingredientId: z.string().uuid(),
  lotId: z.string().uuid().optional().nullable(),
  quantity: z.number().min(0.01)
});

export const createProductionSchema = z.object({
  branchId: z.string().uuid(),
  recipeId: z.string().uuid().optional().nullable(),
  productId: z.string().uuid(),
  plannedQuantity: z.number().min(0.01),
  producedQuantity: z.number().min(0.01),
  yieldPercentage: z.number().optional().nullable(),
  startedAt: z.string().optional().nullable(),
  finishedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  ingredients: z.array(productionIngredientSchema).min(1)
});

export const updateProductionSchema = createProductionSchema.partial();
