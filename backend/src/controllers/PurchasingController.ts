import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class PurchasingController {
  
  async listPOs(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branchId;
      if (!branchId) return res.status(400).json({ error: 'BranchId is required' });

      const pos = await prisma.purchaseOrder.findMany({
        where: { branchId },
        include: {
          supplier: true,
          user: { select: { name: true } },
          items: { include: { product: true } }
        },
        orderBy: { orderDate: 'desc' }
      });
      return res.status(200).json(pos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createPO(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branchId;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      
      if (!branchId || !companyId || !userId) {
         return res.status(400).json({ error: 'Missing user context' });
      }

      const { supplierId, expectedDeliveryDate, notes, items } = req.body;
      
      if (!items || !items.length) {
         return res.status(400).json({ error: 'Cannot create PO without items' });
      }

      const totalAmount = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unitPrice || 0)), 0);

      const po = await prisma.purchaseOrder.create({
        data: {
          branchId,
          companyId,
          userId,
          supplierId,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
          totalAmount,
          notes,
          status: 'RASCUNHO',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
              unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
              total: (item.unitPrice ? Number(item.unitPrice) : 0) * Number(item.quantity)
            }))
          }
        },
        include: { items: true, supplier: true }
      });

      return res.status(201).json(po);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async approvePO(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const branchId = req.user?.branchId;

      const po = await prisma.purchaseOrder.findFirst({ where: { id, branchId } });
      if (!po) return res.status(404).json({ error: 'PO not found' });

      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'APROVADO' }
      });

      // No mundo real, aqui dispararíamos um e-mail com PDF do pedido para o fornecedor
      
      return res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async cancelPO(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const branchId = req.user?.branchId;

      const po = await prisma.purchaseOrder.findFirst({ where: { id, branchId } });
      if (!po) return res.status(404).json({ error: 'PO not found' });

      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'CANCELADO' }
      });
      
      return res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
