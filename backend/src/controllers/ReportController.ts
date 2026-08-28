import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ReportController {
  async getStock(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const balances = await prisma.stockBalance.findMany({
        where: branchId ? { branchId } : {},
        include: { product: { include: { category: true } }, location: true },
        orderBy: { product: { name: 'asc' } }
      });
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de estoque' });
    }
  }

  async getMovements(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const movements = await prisma.stockMovement.findMany({
        where: branchId ? {
          OR: [
            { originBranchId: branchId },
            { destinationBranchId: branchId }
          ]
        } : {},
        include: { product: true, user: true, originLocation: true, destinationLocation: true },
        orderBy: { createdAt: 'desc' },
        take: 500
      });
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de movimentações' });
    }
  }

  async getLosses(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const losses = await prisma.loss.findMany({
        where: branchId ? { branchId } : {},
        include: { product: true, lot: true, user: true },
        orderBy: { date: 'desc' },
        take: 500
      });
      res.json(losses);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de perdas' });
    }
  }

  async getExpirations(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const lots = await prisma.lot.findMany({
        where: {
          branchId: branchId ? branchId : undefined,
          status: { not: 'CONSUMIDO' },
          currentQty: { gt: 0 }
        },
        include: { product: true, location: true, supplier: true },
        orderBy: { expirationDate: 'asc' },
        take: 500
      });
      res.json(lots);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de validades' });
    }
  }

  async getReceivings(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const receivings = await prisma.receiving.findMany({
        where: branchId ? { branchId } : {},
        include: { supplier: true, user: true, items: { include: { product: true } } },
        orderBy: { date: 'desc' },
        take: 100
      });
      res.json(receivings);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de recebimentos' });
    }
  }

  async getInventories(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const inventories = await prisma.inventory.findMany({
        where: branchId ? { branchId } : {},
        include: { user: true, items: { include: { product: true } } },
        orderBy: { date: 'desc' },
        take: 100
      });
      res.json(inventories);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de inventários' });
    }
  }

  async getProductions(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const productions = await prisma.production.findMany({
        where: branchId ? { branchId } : {},
        include: { product: true, user: true, recipe: true },
        orderBy: { startedAt: 'desc' },
        take: 100
      });
      res.json(productions);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de produções' });
    }
  }

  async getCmv(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const snapshots = await prisma.stockSnapshot.findMany({
        where: branchId ? { branchId } : {},
        orderBy: { date: 'desc' },
        take: 12
      });
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de CMV' });
    }
  }

  async getAbcCurve(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const branchId = req.query.branchId as string;

      // Buscar todos os produtos e seus saldos de estoque
      const products = await prisma.product.findMany({
        where: { companyId, status: 'ATIVO' },
        include: {
          category: true,
          stockBalances: {
            where: branchId ? { branchId } : {}
          }
        }
      });

      // Calcular o valor total em estoque para cada produto
      const items = products.map(p => {
        const qty = p.stockBalances.reduce((acc, b) => acc + b.quantity, 0);
        const cost = p.costPrice || 0;
        const value = qty * cost;
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          categoryName: p.category?.name || '-',
          qty,
          cost,
          value
        };
      }).filter(item => item.value > 0);

      // Ordenar por valor decrescente
      items.sort((a, b) => b.value - a.value);

      // Calcular o valor total do estoque de todos os itens
      const totalInventoryValue = items.reduce((acc, item) => acc + item.value, 0);

      // Classificar em A (80%), B (15%), C (5%) do valor acumulado, ou A(20% itens)
      let accumulatedValue = 0;
      const abcData = items.map(item => {
        accumulatedValue += item.value;
        const accumPercent = (accumulatedValue / totalInventoryValue) * 100;
        
        let classification = 'C';
        if (accumPercent <= 80) classification = 'A';
        else if (accumPercent <= 95) classification = 'B';

        return { ...item, accumulatedValue, accumPercent, classification };
      });

      res.json(abcData);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar curva ABC' });
    }
  }

  async getInvoices(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const { companyId } = req.user!;
      
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId,
          ...(branchId ? { branchId } : {})
        },
        include: {
          supplier: true,
          costCenter: true,
          invoiceType: true,
          branch: true,
          user: true
        },
        orderBy: { issueDate: 'desc' },
        take: 1000
      });
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório de notas' });
    }
  }
}
