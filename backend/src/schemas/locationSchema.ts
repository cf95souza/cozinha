import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  type: z.string().optional().nullable(),
  minTemperature: z.number().nullable().optional(),
  maxTemperature: z.number().nullable().optional(),
  capacity: z.number().positive().nullable().optional(),
  branchId: z.string().uuid('ID da filial inválido').optional().nullable()
});
