import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class SaleController {
  
  async create(req: AuthRequest, res: Response) {
    try {
      const { items, paymentType, totalAmount } = req.body;
      const branchId = req.user?.branchId;
      const userId = req.user?.id;

      if (!branchId || !userId) {
        return res.status(400).json({ error: 'Usuário não vinculado a uma filial' });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Nenhum item na venda' });
      }

      // Iniciar a transação
      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Criar a Venda
        const sale = await tx.sale.create({
          data: {
            branchId,
            userId,
            paymentType,
            totalAmount,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice
              }))
            }
          },
          include: { items: true }
        });

        // 2. Dar baixa no estoque
        for (const item of sale.items) {
          // Verificar se o produto tem receita
          const recipe = await tx.recipe.findFirst({
            where: { productId: item.productId, branchId },
            include: { items: true }
          });

          if (recipe) {
            // Dar baixa nos ingredientes da receita (Ficha Técnica)
            // Rendimento esperado vs quantidade vendida
            const multiplier = item.quantity / recipe.expectedYield;
            
            for (const rItem of recipe.items) {
              const qtyToDeduct = rItem.quantity * multiplier;
              
              // Buscar local padrão do ingrediente no branch
              const stock = await tx.stockBalance.findFirst({
                where: { productId: rItem.ingredientId, branchId },
                orderBy: { quantity: 'desc' } // Pega o local com mais estoque por padrão
              });

              if (stock) {
                await tx.stockBalance.update({
                  where: { id: stock.id },
                  data: { quantity: { decrement: qtyToDeduct } }
                });

                await tx.stockMovement.create({
                  data: {
                    productId: rItem.ingredientId,
                    type: 'SAIDA_VENDA_RECEITA',
                    quantity: qtyToDeduct,
                    originBranchId: branchId,
                    originLocationId: stock.locationId,
                    userId
                  }
                });
              }
            }
          } else {
            // Dar baixa no próprio produto vendido
            const stock = await tx.stockBalance.findFirst({
              where: { productId: item.productId, branchId },
              orderBy: { quantity: 'desc' }
            });

            if (stock) {
              await tx.stockBalance.update({
                where: { id: stock.id },
                data: { quantity: { decrement: item.quantity } }
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  type: 'SAIDA_VENDA',
                  quantity: item.quantity,
                  originBranchId: branchId,
                  originLocationId: stock.locationId,
                  userId
                }
              });
            }
          }
        }

        return sale;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao registrar venda' });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string || req.user?.branchId;
      
      const sales = await prisma.sale.findMany({
        where: { branchId },
        include: { items: { include: { product: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      res.json(sales);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar vendas' });
    }
  }
}
