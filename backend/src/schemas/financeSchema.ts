import { z } from 'zod';

export const createCostCenterSchema = z.object({
  name: z.string().min(1)
});
export const updateCostCenterSchema = createCostCenterSchema.partial();

export const createInvoiceTypeSchema = z.object({
  name: z.string().min(1)
});
export const updateInvoiceTypeSchema = createInvoiceTypeSchema.partial();

export const createInvoiceOriginSchema = z.object({
  name: z.string().min(1)
});
export const updateInvoiceOriginSchema = createInvoiceOriginSchema.partial();

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceKey: z.string().optional().nullable(),
  issueDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
  }, z.date()),
  dueDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
  }, z.date()),
  totalAmount: z.number().min(0),
  interestAmount: z.number().min(0).optional().nullable(),
  freightAmount: z.number().min(0).optional().nullable(),
  discountAmount: z.number().min(0).optional().nullable(),
  supplierId: z.string().uuid(),
  costCenterId: z.string().uuid(),
  invoiceTypeId: z.string().uuid(),
  invoiceOriginId: z.string().uuid()
});
export const updateInvoiceSchema = createInvoiceSchema.partial();
