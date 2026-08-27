import { z } from 'zod';

export const receivingItemSchema = z.object({
  productId: z.string().uuid(),
  requestedQty: z.number().min(0.01),
  receivedQty: z.number().min(0).optional().nullable(),
  unit: z.string().min(1),
  lotNumber: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(), // date string
  temperature: z.number().optional().nullable(),
  packageStatus: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createReceivingSchema = z.object({
  invoice: z.string().optional().nullable(),
  date: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  supplierId: z.string().uuid(),
  branchId: z.string().uuid(),
  items: z.array(receivingItemSchema).min(1),
});

export const updateReceivingSchema = createReceivingSchema.partial();
