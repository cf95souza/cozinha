import { z } from 'zod';

export const createLossSchema = z.object({
  productId: z.string().uuid(),
  lotId: z.string().uuid().optional().nullable(),
  quantity: z.number().min(0.01),
  unit: z.string().min(1),
  reason: z.string().min(1),
  locationId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid(),
  photoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  date: z.string().optional()
});

export const updateLossSchema = createLossSchema.partial();
