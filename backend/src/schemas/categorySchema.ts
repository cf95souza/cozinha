import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  branchId: z.string().uuid('ID da filial inválido').optional().nullable()
});
