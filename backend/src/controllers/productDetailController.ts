import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getProductHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    const { branchId } = req.query;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        location: true,
        stockBalances: {
          where: branchId ? { branchId: branchId as string } : {},
          include: { branch: true, location: true }
        },
        lots: {
          where: branchId ? { branchId: branchId as string } : {},
          orderBy: { expirationDate: 'asc' },
          take: 10
        },
        stockMovements: {
          where: branchId ? { destinationBranchId: branchId as string } : {},
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { name: true } }, destinationBranch: true }
        }
      }
    });

    if (!product || product.companyId !== companyId) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    // Build the 30-day stock variation mock for now (since we don't have daily snapshots yet)
    // In a real system, we would query StockSnapshot grouped by date.
    const variationChart = [];
    let currentQty = product.stockBalances.reduce((acc, b) => acc + b.quantity, 0);
    
    // Reverse engineer stock from movements for the last 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Calculate qty on that day (just a rough approximation for the demo chart)
      variationChart.unshift({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        quantidade: currentQty
      });
      
      // adjust currentQty backwards based on movements of that day
      const dayMovements = product.stockMovements.filter((m: any) => new Date(m.createdAt).toISOString().split('T')[0] === dateStr);
      dayMovements.forEach((m: any) => {
        if (m.type.includes('ENTRADA')) currentQty -= m.quantity;
        else if (m.type.includes('SAIDA') || m.type.includes('PERDA')) currentQty += m.quantity;
      });
    }

    res.json({
      product,
      variationChart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar histórico do produto' });
  }
};
