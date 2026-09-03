import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class PayableController {
  async list(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string || req.user?.branchId;
      const status = req.query.status as string;

      if (!branchId) return res.status(400).json({ error: 'Branch missing' });

      const payables = await prisma.payable.findMany({
        where: { 
          branchId,
          ...(status ? { status } : {})
        },
        include: {
          category: true,
          supplier: true,
          costCenter: true
        },
        orderBy: { dueDate: 'asc' }
      });

      res.json(payables);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar contas a pagar' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { description, amount, dueDate, status, supplierId, categoryId, costCenterId } = req.body;
      const branchId = req.user?.branchId;
      const companyId = req.user?.companyId;

      if (!branchId || !companyId || !description || !amount || !dueDate || !categoryId) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const payable = await prisma.payable.create({
        data: {
          description,
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
          status: status || 'PENDENTE',
          supplierId: supplierId || null,
          categoryId,
          costCenterId: costCenterId || null,
          branchId,
          companyId
        }
      });

      res.status(201).json(payable);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao criar conta a pagar' });
    }
  }

  async pay(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Iniciar transação: Marcar como PAGO e gerar FinancialTransaction
      const result = await prisma.$transaction(async (tx) => {
        const payable = await tx.payable.findUnique({ where: { id } });
        if (!payable) throw new Error('Conta não encontrada');
        if (payable.status === 'PAGO') throw new Error('Conta já está paga');

        const updated = await tx.payable.update({
          where: { id },
          data: { status: 'PAGO' }
        });

        const transaction = await tx.financialTransaction.create({
          data: {
            description: `Pagamento: ${payable.description}`,
            amount: payable.amount,
            type: 'SAIDA',
            date: new Date(),
            paymentMethod: paymentMethod || 'OUTROS',
            payableId: payable.id,
            categoryId: payable.categoryId,
            branchId: payable.branchId,
            companyId: payable.companyId,
            userId
          }
        });

        return { payable: updated, transaction };
      });

      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: error.message || 'Erro ao processar pagamento' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await prisma.payable.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao deletar conta a pagar' });
    }
  }
}
