import { z } from 'zod';

export const inventoryItemSchema = z.object({
  productId: z.string().uuid(),
  theoreticalQuantity: z.number(),
  physicalQuantity: z.number(),
  difference: z.number(),
  notes: z.string().optional().nullable(),
});

export const createInventorySchema = z.object({
  branchId: z.string().uuid(),
  status: z.string().optional(),
  date: z.string().optional(),
  items: z.array(inventoryItemSchema).min(1),
});

export const updateInventorySchema = createInventorySchema.partial();
