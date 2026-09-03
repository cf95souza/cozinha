import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ReceivableController {
  async list(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string || req.user?.branchId;
      const status = req.query.status as string;

      if (!branchId) return res.status(400).json({ error: 'Branch missing' });

      const receivables = await prisma.receivable.findMany({
        where: { 
          branchId,
          ...(status ? { status } : {})
        },
        include: {
          category: true,
          costCenter: true
        },
        orderBy: { dueDate: 'asc' }
      });

      res.json(receivables);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar contas a receber' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { description, amount, dueDate, status, categoryId, costCenterId } = req.body;
      const branchId = req.user?.branchId;
      const companyId = req.user?.companyId;

      if (!branchId || !companyId || !description || !amount || !dueDate || !categoryId) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const receivable = await prisma.receivable.create({
        data: {
          description,
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
          status: status || 'PENDENTE',
          categoryId,
          costCenterId: costCenterId || null,
          branchId,
          companyId
        }
      });

      res.status(201).json(receivable);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao criar conta a receber' });
    }
  }

  async receive(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await prisma.$transaction(async (tx) => {
        const receivable = await tx.receivable.findUnique({ where: { id } });
        if (!receivable) throw new Error('Conta não encontrada');
        if (receivable.status === 'RECEBIDO') throw new Error('Conta já está recebida');

        const updated = await tx.receivable.update({
          where: { id },
          data: { status: 'RECEBIDO' }
        });

        const transaction = await tx.financialTransaction.create({
          data: {
            description: `Recebimento: ${receivable.description}`,
            amount: receivable.amount,
            type: 'ENTRADA',
            date: new Date(),
            paymentMethod: paymentMethod || 'OUTROS',
            receivableId: receivable.id,
            categoryId: receivable.categoryId,
            branchId: receivable.branchId,
            companyId: receivable.companyId,
            userId
          }
        });

        return { receivable: updated, transaction };
      });

      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: error.message || 'Erro ao processar recebimento' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await prisma.receivable.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao deletar conta a receber' });
    }
  }
}
