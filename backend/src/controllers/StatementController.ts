import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class StatementController {
  async getStatement(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string || req.user?.branchId;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const whereClause: any = {
        ...(branchId ? { branchId } : {}),
      };

      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const transactions = await prisma.financialTransaction.findMany({
        where: whereClause,
        include: {
          category: true,
          user: { select: { name: true } }
        },
        orderBy: { date: 'desc' }
      });

      // Calcular saldo (Simples)
      const totalIn = transactions.filter((t: any) => t.type === 'ENTRADA').reduce((acc: any, t: any) => acc + t.amount, 0);
      const totalOut = transactions.filter((t: any) => t.type === 'SAIDA').reduce((acc: any, t: any) => acc + t.amount, 0);
      const balance = totalIn - totalOut;

      res.json({
        totalIn,
        totalOut,
        balance,
        transactions
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar extrato' });
    }
  }
}
