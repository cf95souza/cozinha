import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { z } from 'zod';
import { NfceService } from '../services/NfceService';

const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    discountType: z.enum(['PERCENT', 'FIXED']).optional(),
    discountValue: z.number().nonnegative().optional()
  })).min(1),
  paymentMethods: z.array(z.object({
    type: z.enum(['PIX', 'CREDITO', 'DEBITO', 'DINHEIRO']),
    amount: z.number().positive()
  })).min(1),
  totalAmount: z.number().nonnegative(),
  discountType: z.enum(['PERCENT', 'FIXED']).optional(),
  discountValue: z.number().nonnegative().optional()
});

export class SaleController {
  
  async create(req: AuthRequest, res: Response) {
    try {
      const parsed = createSaleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues });
      }

      const { items, paymentMethods, totalAmount, discountType, discountValue } = parsed.data;
      const branchId = req.user?.branchId;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!branchId || !userId || !companyId) {
        return res.status(400).json({ error: 'Usuário não vinculado a uma filial ou empresa' });
      }

      // Validar que soma dos pagamentos = totalAmount
      const sumPayments = paymentMethods.reduce((acc, p) => acc + p.amount, 0);
      if (Math.abs(sumPayments - totalAmount) > 0.01) {
        return res.status(400).json({ error: 'Soma dos pagamentos deve ser igual ao total da venda' });
      }

      // Iniciar a transação
      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Criar a Venda (usar primeiro método como principal para compatibilidade)
        const primaryPaymentType = paymentMethods[0]?.type || 'PIX';
        const sale = await tx.sale.create({
          data: {
            branchId,
            userId,
            paymentType: primaryPaymentType,
            totalAmount,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                discountType: item.discountType,
                discountValue: item.discountValue
              }))
            }
          },
          include: { items: true }
        });

        // =====================================
        // INTEGRAÇÃO FINANCEIRA (Fase 16)
        // =====================================
        let saleCategory = await tx.financialCategory.findFirst({
          where: { companyId, name: 'Vendas PDV', type: 'RECEITA' }
        });
        
        if (!saleCategory) {
          saleCategory = await tx.financialCategory.create({
            data: { name: 'Vendas PDV', type: 'RECEITA', companyId }
          });
        }

        // Processar cada forma de pagamento
        for (const pm of paymentMethods) {
          if (pm.type === 'CREDITO') {
            // Criar Contas a Receber (D+30)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            await tx.receivable.create({
              data: {
                description: `Venda PDV #${sale.id.slice(0, 6)} (${pm.type})`,
                amount: pm.amount,
                dueDate,
                categoryId: saleCategory.id,
                branchId,
                companyId
              }
            });
          } else {
            // Criar Transação Direta (Entrada no Fluxo de Caixa)
            await tx.financialTransaction.create({
              data: {
                description: `Venda PDV #${sale.id.slice(0, 6)} (${pm.type})`,
                amount: pm.amount,
                type: 'ENTRADA',
                paymentMethod: pm.type,
                categoryId: saleCategory.id,
                branchId,
                companyId,
                userId
              }
            });

            // Se for dinheiro, injetar o valor no Caixa do Operador (se houver um turno aberto)
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
                    description: `Venda PDV #${sale.id.slice(0, 6)}`,
                    userId
                  }
                });
              }
            }
          }
        }

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

              let targetLocationId = stock?.locationId;
              
              if (!targetLocationId) {
                const fallbackLocation = await tx.location.findFirst({ where: { branchId } });
                if (!fallbackLocation) throw new Error("Nenhum local de armazenamento cadastrado nesta filial.");
                targetLocationId = fallbackLocation.id;
              }

              if (stock) {
                await tx.stockBalance.update({
                  where: { id: stock.id },
                  data: { quantity: { decrement: qtyToDeduct } }
                });
              } else {
                await tx.stockBalance.create({
                  data: {
                    productId: rItem.ingredientId,
                    branchId,
                    locationId: targetLocationId,
                    quantity: -qtyToDeduct
                  }
                });
              }

              await tx.stockMovement.create({
                data: {
                  productId: rItem.ingredientId,
                  type: 'SAIDA_VENDA_RECEITA',
                  quantity: qtyToDeduct,
                  originBranchId: branchId,
                  originLocationId: targetLocationId,
                  userId
                }
              });
            }
          } else {
            // Dar baixa no próprio produto vendido
            const stock = await tx.stockBalance.findFirst({
              where: { productId: item.productId, branchId },
              orderBy: { quantity: 'desc' }
            });

            let targetLocationId = stock?.locationId;
            
            if (!targetLocationId) {
              const fallbackLocation = await tx.location.findFirst({ where: { branchId } });
              if (!fallbackLocation) throw new Error("Nenhum local de armazenamento cadastrado nesta filial.");
              targetLocationId = fallbackLocation.id;
            }

            if (stock) {
              await tx.stockBalance.update({
                where: { id: stock.id },
                data: { quantity: { decrement: item.quantity } }
              });
            } else {
              await tx.stockBalance.create({
                data: {
                  productId: item.productId,
                  branchId,
                  locationId: targetLocationId,
                  quantity: -item.quantity
                }
              });
            }

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'SAIDA_VENDA',
                quantity: item.quantity,
                originBranchId: branchId,
                originLocationId: targetLocationId,
                userId
              }
            });
          }
        }

        return sale;
      });

      // Emissão Automática da NFC-e (Fase 17)
      const nfceService = new NfceService();
      const nfceResult = await nfceService.emitNfce({
        saleId: result.id,
        branchId: result.branchId,
        totalAmount: result.totalAmount,
        items: result.items
      });

      // Anexar o resultado da NFC-e à resposta para o frontend
      res.status(201).json({
        ...result,
        nfce: nfceResult
      });
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('Nenhum local de armazenamento')) {
        return res.status(400).json({ error: error.message });
      }
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
