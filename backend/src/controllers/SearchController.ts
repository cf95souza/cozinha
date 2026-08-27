import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class SearchController {
  async search(req: AuthRequest, res: Response) {
    try {
      const q = req.query.q as string;
      const branchId = req.query.branchId as string;

      if (!q || q.length < 2) {
        return res.json({ products: [], lots: [], suppliers: [], receivings: [], movements: [] });
      }

      const products = await prisma.product.findMany({
        where: {
          branchId: branchId ? branchId : undefined,
          status: 'ATIVO',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { barcode: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      });

      const lots = await prisma.lot.findMany({
        where: {
          branchId: branchId ? branchId : undefined,
          number: { contains: q, mode: 'insensitive' }
        },
        include: { product: true },
        take: 5
      });

      const suppliers = await prisma.supplier.findMany({
        where: {
          branchId: branchId ? branchId : undefined,
          status: 'ATIVO',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { tradeName: { contains: q, mode: 'insensitive' } },
            { document: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      });

      const receivings = await prisma.receiving.findMany({
        where: {
          branchId: branchId ? branchId : undefined,
          invoice: { contains: q, mode: 'insensitive' }
        },
        include: { supplier: true },
        take: 5
      });

      res.json({ products, lots, suppliers, receivings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao realizar busca global' });
    }
  }
}
