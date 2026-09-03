import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class QuotationController {
  
  // Salva os valores cotados para histórico, e opcionalmente gera um Pedido de Compra se solicitado
  async saveQuotations(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branchId;
      if (!branchId) return res.status(400).json({ error: 'BranchId is required' });

      // array de objetos: { productId, supplierId, price }
      const { quotations, generatePO, supplierId } = req.body;
      
      if (!quotations || !quotations.length) {
         return res.status(400).json({ error: 'No quotations provided' });
      }

      // 1. Grava no histórico (SupplierQuotation)
      await prisma.supplierQuotation.createMany({
        data: quotations.map((q: any) => ({
          branchId,
          productId: q.productId,
          supplierId: q.supplierId,
          price: Number(q.price),
          date: new Date()
        }))
      });

      // 2. Opcional: Gerar PO automático para o supplier vencedor
      if (generatePO && supplierId) {
         const companyId = req.user!.companyId;
         const userId = req.user!.id;
         
         const winningQuotes = quotations.filter((q: any) => q.supplierId === supplierId);
         const totalAmount = winningQuotes.reduce((acc: number, q: any) => acc + (Number(q.price) * Number(q.quantity || 1)), 0);

         const po = await prisma.purchaseOrder.create({
            data: {
              branchId,
              companyId,
              userId,
              supplierId,
              status: 'RASCUNHO',
              totalAmount,
              items: {
                create: winningQuotes.map((q: any) => ({
                  productId: q.productId,
                  quantity: Number(q.quantity || 1),
                  unitPrice: Number(q.price),
                  total: Number(q.price) * Number(q.quantity || 1)
                }))
              }
            }
         });
         return res.status(201).json({ message: 'Cotações salvas e Pedido gerado', po });
      }

      return res.status(201).json({ message: 'Cotações salvas com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Puxa o histórico de preços para o gráfico
  async getPriceHistory(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branchId;
      const { productId } = req.params;

      if (!branchId) return res.status(400).json({ error: 'BranchId is required' });

      // Busca do histórico formal de cotação
      const quotes = await prisma.supplierQuotation.findMany({
        where: { branchId, productId },
        include: { supplier: { select: { name: true } } },
        orderBy: { date: 'asc' }
      });

      // Busca do histórico real (Recebimentos) - Fase anterior
      const receivings = await prisma.receivingItem.findMany({
        where: { productId, receiving: { branchId } },
        include: { receiving: { include: { supplier: { select: { name: true } } } } },
        orderBy: { receiving: { date: 'asc' } }
      });

      // Agrupar ambos num formato fácil pro Recharts
      const history: any[] = [];
      
      quotes.forEach(q => {
         history.push({
           date: q.date,
           price: q.price,
           source: 'Cotação',
           supplierName: q.supplier.name
         });
      });

      receivings.forEach(r => {
         if (r.unitPrice) {
           history.push({
             date: r.receiving.date,
             price: r.unitPrice,
             source: 'NF/Recebimento',
             supplierName: r.receiving.supplier.name
           });
         }
      });

      // Ordena por data
      history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return res.status(200).json(history);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
