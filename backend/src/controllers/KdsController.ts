import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['PEDIDO', 'PREPARANDO', 'ENTREGUE'])
});

export class KdsController {
  
  // Listar todas as vendas (Mesas/Balcão) que tenham itens pendentes
  async listActive(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branchId;
      if (!branchId) return res.status(400).json({ error: 'Filial não encontrada no token' });

      // Buscar Vendas que possuem SaleItems cujo status seja PEDIDO ou PREPARANDO
      // É mais eficiente buscar as Vendas e fazer o include dos itens pendentes
      const activeSales = await prisma.sale.findMany({
        where: {
          branchId,
          items: {
            some: {
              status: { in: ['PEDIDO', 'PREPARANDO'] }
            }
          }
        },
        include: {
          items: {
            where: {
              status: { in: ['PEDIDO', 'PREPARANDO'] }
            },
            include: {
              product: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          user: {
            select: { name: true }
          }
        },
        orderBy: {
          createdAt: 'asc' // Tickets mais antigos primeiro
        }
      });

      res.json(activeSales);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar dados do KDS' });
    }
  }

  // Atualizar o status de um item específico (ex: Cozinheiro deu 'Pronto' no Hambúrguer)
  async updateItemStatus(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Status inválido' });

      const branchId = req.user?.branchId;
      if (!branchId) return res.status(400).json({ error: 'Filial não encontrada no token' });

      // Verifica se o item pertence à filial
      const saleItem = await prisma.saleItem.findFirst({
        where: { id: itemId, sale: { branchId } }
      });

      if (!saleItem) return res.status(404).json({ error: 'Item não encontrado ou acesso negado' });

      const updated = await prisma.saleItem.update({
        where: { id: itemId },
        data: { status: parsed.data.status }
      });

      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao atualizar status do item' });
    }
  }
}
