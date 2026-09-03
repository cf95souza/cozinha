import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class DashboardController {
  async getKpis(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const isHolding = branchId === 'holding';
      const whereBranch = (branchId && !isHolding) ? { branchId } : {};

      // 1. Produtos
      const totalProducts = await prisma.product.count({
        where: isHolding ? {} : { branchId: branchId || undefined }
      });

      // 2. Valor Estimado em Estoque (Qty * CostPrice)
      const balances = await prisma.stockBalance.findMany({
        where: whereBranch,
        include: { 
          location: true,
          product: { include: { category: true } } 
        }
      });
      
      const totalValue = balances.reduce((sum: number, bal: any) => {
        const cost = bal.product.costPrice || 0;
        return sum + (bal.quantity * cost);
      }, 0);

      // 3. Recebimentos Pendentes
      const pendingReceivings = await prisma.receiving.count({
        where: {
          ...whereBranch,
          status: 'AGUARDANDO_CONFERENCIA'
        }
      });

      // 4. Produtos Abaixo do Mínimo
      let belowMinCount = 0;
      balances.forEach((bal: any) => {
        if (bal.product.minStock > 0 && bal.quantity < bal.product.minStock) {
          belowMinCount++;
        }
      });

      // 5. Lotes Próximos ao Vencimento (7 dias)
      const now = new Date();
      const in7Days = new Date();
      in7Days.setDate(now.getDate() + 7);

      const expiringLots = await prisma.lot.count({
        where: {
          ...whereBranch,
          expirationDate: {
            lte: in7Days,
            gte: now
          },
          currentQty: { gt: 0 }
        }
      });
      
      const expiredLots = await prisma.lot.count({
        where: {
          ...whereBranch,
          expirationDate: { lt: now },
          currentQty: { gt: 0 }
        }
      });

      // NOVIDADES: DADOS RICOS PARA AS TABELAS

      // 6. Lista de Produtos Críticos
      const criticalProducts = balances
        .filter((bal: any) => bal.product.minStock > 0 && bal.quantity < bal.product.minStock)
        .map((bal: any) => ({
          id: bal.product.id,
          name: bal.product.name,
          unit: bal.product.unit,
          quantity: bal.quantity,
          minStock: bal.product.minStock,
          location: bal.location.name
        }));

      // 7. Lista de Lotes Vencendo ou Vencidos
      const expiringLotsDetails = await prisma.lot.findMany({
        where: {
          ...whereBranch,
          expirationDate: {
            lte: in7Days,
          },
          currentQty: { gt: 0 }
        },
        include: { product: true, location: true },
        orderBy: { expirationDate: 'asc' },
        take: 10
      });

      // 8. Últimas Movimentações (Extrato)
      const recentMovements = await prisma.stockMovement.findMany({
        where: (branchId && !isHolding) ? {
          OR: [
            { originBranchId: branchId },
            { destinationBranchId: branchId }
          ]
        } : {},
        include: { product: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 6
      });

      // 9. Dados do Gráfico de Categoria
      const categoryMap = new Map<string, number>();
      balances.forEach((bal: any) => {
        const catName = bal.product.category?.name || 'Sem Categoria';
        const cost = bal.product.costPrice || 0;
        const val = bal.quantity * cost;
        if (val > 0) {
          categoryMap.set(catName, (categoryMap.get(catName) || 0) + val);
        }
      });
      const categoryChart = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

      // 10. Dados do Gráfico de Movimentações (Últimos 7 dias)
      const past7Days = new Date();
      past7Days.setDate(now.getDate() - 7);
      
      const allMovements = await prisma.stockMovement.findMany({
        where: {
          createdAt: { gte: past7Days },
          ...((branchId && !isHolding) ? { OR: [{ originBranchId: branchId }, { destinationBranchId: branchId }] } : {})
        }
      });

      const movementsMap = new Map<string, { date: string, entradas: number, saidas: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        movementsMap.set(dateStr, { date: dateStr, entradas: 0, saidas: 0 });
      }

      allMovements.forEach(m => {
        const dateStr = m.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (movementsMap.has(dateStr)) {
          const entry = movementsMap.get(dateStr)!;
          if (m.type.includes('ENTRADA')) {
            entry.entradas += m.quantity;
          } else if (m.type.includes('SAIDA') || m.type.includes('PERDA')) {
            entry.saidas += m.quantity;
          }
        }
      });
      const movementsChart = Array.from(movementsMap.values());

      // 11. Ranking de Filiais (Visão Holding)
      let branchRankings: any[] = [];
      if (isHolding) {
        const branches = await prisma.branch.findMany({ where: { status: 'ATIVO' } });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        for (const b of branches) {
          const sales = await prisma.sale.aggregate({
            where: { branchId: b.id, createdAt: { gte: thirtyDaysAgo }, status: 'FINALIZADO' },
            _sum: { totalAmount: true }
          });
          
          const losses = await prisma.stockMovement.findMany({
            where: { originBranchId: b.id, type: 'PERDA', createdAt: { gte: thirtyDaysAgo } },
            include: { product: true }
          });
          const totalLosses = losses.reduce((acc, l) => acc + (l.quantity * (l.product.costPrice || 0)), 0);
          
          branchRankings.push({
            branchName: b.name,
            sales: sales._sum.totalAmount || 0,
            losses: totalLosses
          });
        }
        branchRankings.sort((a, b) => b.sales - a.sales);
      }

      res.status(200).json({
        totalProducts,
        totalValue,
        pendingReceivings,
        belowMinCount,
        expiringLots,
        expiredLots,
        criticalProducts,
        expiringLotsDetails,
        recentMovements,
        categoryChart,
        movementsChart,
        branchRankings
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
  }
}
