import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getPurchaseSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const { branchId } = req.query;

    const products = await prisma.product.findMany({
      where: { companyId, status: 'ATIVO' },
      include: {
        supplier: true,
        stockBalances: {
          where: branchId ? { branchId: branchId as string } : {}
        }
      }
    });

    const suggestions = products.map(p => {
      const currentQty = p.stockBalances.reduce((acc, b) => acc + b.quantity, 0);
      const minStock = p.minStock || 0;
      const maxStock = p.maxStock || minStock * 2;
      
      if (currentQty < minStock) {
        const qtyToBuy = maxStock - currentQty;
        const estimatedCost = qtyToBuy * (p.costPrice || 0);
        return {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          unit: p.unit,
          supplierName: p.supplier?.tradeName || p.supplier?.name || 'Sem fornecedor',
          supplierId: p.supplierId,
          currentQty,
          minStock,
          maxStock,
          qtyToBuy,
          estimatedCost
        };
      }
      return null;
    }).filter(item => item !== null);

    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar sugestões de compra' });
  }
};
