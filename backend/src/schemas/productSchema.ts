import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  unit: z.string().min(1),
  brand: z.string().optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  controlled: z.boolean().optional(),
  temperatureControlled: z.boolean().optional(),
  minTemperature: z.number().optional().nullable(),
  maxTemperature: z.number().optional().nullable(),
  costPrice: z.number().optional().nullable(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  defaultExpirationDays: z.number().optional().nullable(),
  conservationMethod: z.string().optional().nullable(),
  sifCode: z.string().optional().nullable(),
  ncmCode: z.string().optional().nullable(),
  sellPrice: z.number().optional().nullable(),
  marginPercentage: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  packageWeight: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  abcClass: z.string().optional().nullable(),
  isComposite: z.boolean().optional(),
  yieldPercentage: z.number().optional().nullable(),
  categoryId: z.string().uuid(),
  locationId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable()
});

export const updateProductSchema = createProductSchema.partial();
