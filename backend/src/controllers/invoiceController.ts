import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createInvoiceSchema } from '../schemas/financeSchema';
import { z } from 'zod';

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { branchId, costCenterId, startDate, endDate } = req.query;
    const where: any = { companyId, status: 'ATIVO' };
    
    if (branchId) where.branchId = branchId;
    if (costCenterId) where.costCenterId = costCenterId;
    if (startDate && endDate) {
      where.issueDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        supplier: true,
        costCenter: true,
        invoiceType: true,
        invoiceOrigin: true,
        branch: true
      },
      orderBy: { issueDate: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notas' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.user!;
    const branchId = req.headers['x-branch-id'] as string;
    
    if (!branchId) {
       res.status(400).json({ error: 'Filial não selecionada' });
       return;
    }

    const data = createInvoiceSchema.parse(req.body);
    
    const finalAmount = data.totalAmount + (data.interestAmount || 0) + (data.freightAmount || 0) - (data.discountAmount || 0);

    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        finalAmount,
        companyId,
        branchId,
        userId: req.user!.id
      }
    });
    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
       res.status(400).json({ error: 'Dados inválidos', details: error.issues });
       return;
    }
    res.status(500).json({ error: 'Erro ao criar nota fiscal' });
  }
};
