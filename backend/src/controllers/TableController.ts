import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { z } from 'zod';

const createTableSchema = z.object({
  tableNumber: z.string().optional(),
  customerName: z.string().optional()
});

const addItemsSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    discountType: z.enum(['PERCENT', 'FIXED']).optional(),
    discountValue: z.number().nonnegative().optional()
  })).min(1)
});

const checkoutSchema = z.object({
  paymentMethods: z.array(z.object({
    type: z.enum(['PIX', 'CREDITO', 'DEBITO', 'DINHEIRO']),
    amount: z.number().positive()
  })).min(1),
  totalAmount: z.number().nonnegative(),
  discountType: z.enum(['PERCENT', 'FIXED']).optional(),
  discountValue: z.number().nonnegative().optional()
});

export class TableController {
  
  // Listar Mesas/Comandas Abertas
  async listOpen(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branchId;
      if (!branchId) return res.status(400).json({ error: 'Usuário não vinculado a uma filial' });

      const tables = await prisma.sale.findMany({
        where: { branchId, status: 'ABERTO', type: { in: ['MESA', 'COMANDA'] } },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      });

      res.json(tables);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar mesas abertas' });
    }
  }

  // Abrir nova Mesa/Comanda
  async openTable(req: AuthRequest, res: Response) {
    try {
      const parsed = createTableSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });

      const branchId = req.user?.branchId;
      const userId = req.user?.id;
      if (!branchId || !userId) return res.status(400).json({ error: 'Credenciais inválidas' });

      const { tableNumber, customerName } = parsed.data;

      const newTable = await prisma.sale.create({
        data: {
          branchId,
          userId,
          type: tableNumber ? 'MESA' : 'COMANDA',
          tableNumber,
          customerName,
          status: 'ABERTO',
          totalAmount: 0
        }
      });

      res.status(201).json(newTable);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao abrir mesa' });
    }
  }

  // Adicionar Itens e Baixar Estoque
  async addItems(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const parsed = addItemsSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });

      const branchId = req.user?.branchId;
      const userId = req.user?.id;

      if (!branchId || !userId) return res.status(400).json({ error: 'Credenciais inválidas' });

      const sale = await prisma.sale.findFirst({ where: { id, branchId, status: 'ABERTO' } });
      if (!sale) return res.status(404).json({ error: 'Mesa não encontrada ou já finalizada' });

      const { items } = parsed.data;

      const result = await prisma.$transaction(async (tx) => {
        let additionalAmount = 0;

        for (const item of items) {
          // Calcula subtotal do item com desconto
          let baseTotal = item.quantity * item.unitPrice;
          if (item.discountValue && item.discountValue > 0) {
             if (item.discountType === 'PERCENT') {
                baseTotal = baseTotal * (1 - item.discountValue / 100);
             } else {
                baseTotal = Math.max(0, baseTotal - item.discountValue);
             }
          }
          additionalAmount += baseTotal;

          // 1. Criar o item na Venda
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: baseTotal,
              discountType: item.discountType,
              discountValue: item.discountValue,
              status: 'PEDIDO' // Prepara para KDS
            }
          });

          // 2. Dar baixa no estoque
          const recipe = await tx.recipe.findFirst({
            where: { productId: item.productId, branchId },
            include: { items: true }
          });

          if (recipe) {
            const multiplier = item.quantity / recipe.expectedYield;
            for (const rItem of recipe.items) {
              const qtyToDeduct = rItem.quantity * multiplier;
              const stock = await tx.stockBalance.findFirst({
                where: { productId: rItem.ingredientId, branchId },
                orderBy: { quantity: 'desc' }
              });

              if (stock) {
                if (stock.quantity < qtyToDeduct) {
                  throw new Error(`Estoque insuficiente. Necessário: ${qtyToDeduct}, Disponível: ${stock.quantity}`);
                }
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
            const stock = await tx.stockBalance.findFirst({
              where: { productId: item.productId, branchId },
              orderBy: { quantity: 'desc' }
            });

            if (stock) {
              if (stock.quantity < item.quantity) {
                throw new Error(`Estoque insuficiente. Necessário: ${item.quantity}, Disponível: ${stock.quantity}`);
              }
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

        // Atualiza o total da mesa
        return await tx.sale.update({
          where: { id: sale.id },
          data: { totalAmount: { increment: additionalAmount } },
          include: { items: { include: { product: true } } }
        });
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('Estoque insuficiente')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao adicionar itens na mesa' });
    }
  }

  // Cancelar um item da mesa (Restornar Estoque)
  async cancelItem(req: AuthRequest, res: Response) {
    try {
      const { id, itemId } = req.params;
      const branchId = req.user?.branchId;
      const userId = req.user?.id;

      if (!branchId || !userId) return res.status(400).json({ error: 'Credenciais inválidas' });

      const sale = await prisma.sale.findFirst({ where: { id, branchId, status: 'ABERTO' } });
      if (!sale) return res.status(404).json({ error: 'Mesa não encontrada ou já finalizada' });

      const saleItem = await prisma.saleItem.findFirst({ where: { id: itemId, saleId: sale.id } });
      if (!saleItem) return res.status(404).json({ error: 'Item não encontrado na mesa' });
      if (saleItem.status === 'CANCELADO') return res.status(400).json({ error: 'Item já está cancelado' });

      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Marcar item como cancelado
        await tx.saleItem.update({
          where: { id: saleItem.id },
          data: { status: 'CANCELADO' }
        });

        // 2. Estornar Estoque
        const recipe = await tx.recipe.findFirst({
          where: { productId: saleItem.productId, branchId },
          include: { items: true }
        });

        if (recipe) {
          const multiplier = saleItem.quantity / recipe.expectedYield;
          for (const rItem of recipe.items) {
            const qtyToReturn = rItem.quantity * multiplier;
            const stock = await tx.stockBalance.findFirst({
              where: { productId: rItem.ingredientId, branchId },
              orderBy: { quantity: 'desc' }
            });
            if (stock) {
              await tx.stockBalance.update({
                where: { id: stock.id },
                data: { quantity: { increment: qtyToReturn } }
              });
              await tx.stockMovement.create({
                data: {
                  productId: rItem.ingredientId,
                  type: 'ESTORNO_VENDA_RECEITA',
                  quantity: qtyToReturn,
                  destinationBranchId: branchId,
                  destinationLocationId: stock.locationId,
                  userId
                }
              });
            }
          }
        } else {
          const stock = await tx.stockBalance.findFirst({
            where: { productId: saleItem.productId, branchId },
            orderBy: { quantity: 'desc' }
          });
          if (stock) {
            await tx.stockBalance.update({
              where: { id: stock.id },
              data: { quantity: { increment: saleItem.quantity } }
            });
            await tx.stockMovement.create({
              data: {
                productId: saleItem.productId,
                type: 'ESTORNO_VENDA',
                quantity: saleItem.quantity,
                destinationBranchId: branchId,
                destinationLocationId: stock.locationId,
                userId
              }
            });
          }
        }

        // 3. Atualizar total da mesa subtraindo o item cancelado
        return await tx.sale.update({
          where: { id: sale.id },
          data: { totalAmount: { decrement: saleItem.total } },
          include: { items: { include: { product: true } } }
        });
      });

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao cancelar item' });
    }
  }

  // Fechar Mesa / Pagar
  async checkout(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });

      const branchId = req.user?.branchId;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      if (!branchId || !userId || !companyId) return res.status(400).json({ error: 'Credenciais inválidas' });

      const sale = await prisma.sale.findFirst({ where: { id, branchId, status: 'ABERTO' } });
      if (!sale) return res.status(404).json({ error: 'Mesa não encontrada ou já finalizada' });

      const { paymentMethods, totalAmount } = parsed.data;

      // Validações
      if (Math.abs(sale.totalAmount - totalAmount) > 0.01) {
         // Neste fluxo, confiamos no valor enviado pelo PDV ou poderíamos forçar o do banco. 
         // O PDV pode ter aplicado desconto global.
      }

      const sumPayments = paymentMethods.reduce((acc, p) => acc + p.amount, 0);
      if (Math.abs(sumPayments - totalAmount) > 0.01) {
        return res.status(400).json({ error: 'Soma dos pagamentos deve ser igual ao total da venda' });
      }

      const primaryPaymentType = paymentMethods[0]?.type || 'PIX';

      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Atualizar Venda para CONCLUIDO
        const updatedSale = await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: 'CONCLUIDO',
            paymentType: primaryPaymentType,
            totalAmount: totalAmount // Caso tenha recebido desconto global
          },
          include: { items: { include: { product: true } } }
        });

        // 2. Financeiro
        let saleCategory = await tx.financialCategory.findFirst({
          where: { companyId, name: 'Vendas PDV', type: 'RECEITA' }
        });
        
        if (!saleCategory) {
          saleCategory = await tx.financialCategory.create({
            data: { name: 'Vendas PDV', type: 'RECEITA', companyId }
          });
        }

        for (const pm of paymentMethods) {
          if (pm.type === 'CREDITO') {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            await tx.receivable.create({
              data: {
                description: `Mesa/Comanda #${updatedSale.id.slice(0, 6)} (${pm.type})`,
                amount: pm.amount,
                dueDate,
                categoryId: saleCategory.id,
                branchId,
                companyId
              }
            });
          } else {
            await tx.financialTransaction.create({
              data: {
                description: `Mesa/Comanda #${updatedSale.id.slice(0, 6)} (${pm.type})`,
                amount: pm.amount,
                type: 'ENTRADA',
                paymentMethod: pm.type,
                categoryId: saleCategory.id,
                branchId,
                companyId,
                userId
              }
            });

            if (pm.type === 'DINHEIRO') {
              const shift = await tx.cashShift.findFirst({
                where: { cashRegister: { branchId }, status: 'ABERTO', openedById: userId },
                orderBy: { openedAt: 'desc' }
              });

              if (shift) {
                await tx.cashMovement.create({
                  data: {
                    cashShiftId: shift.id,
                    type: 'VENDA',
                    amount: pm.amount,
                    description: `Mesa/Comanda #${updatedSale.id.slice(0, 6)}`,
                    userId
                  }
                });
              }
            }
          }
        }

        return updatedSale;
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao finalizar mesa' });
    }
  }
}
