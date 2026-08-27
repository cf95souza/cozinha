import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Consulta saldos de uma branch
export const getStockBalances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, productId, locationId } = req.query;

    const where: any = {};
    if (branchId) where.branchId = branchId as string;
    if (productId) where.productId = productId as string;
    if (locationId) where.locationId = locationId as string;

    const balances = await prisma.stockBalance.findMany({
      where,
      include: {
        product: true,
        location: true,
        branch: true
      }
    });
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar saldos de estoque' });
  }
};

// Registra movimentação e atualiza o saldo
export const transferStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { 
      productId, quantity, 
      originBranchId, originLocationId, 
      destinationBranchId, destinationLocationId 
    } = req.body;

    if (!quantity || quantity <= 0) {
      res.status(400).json({ error: 'Quantidade inválida' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Debitar da Origem (se houver origem, pode ser um ajuste de entrada sem origem)
      if (originBranchId && originLocationId) {
        const originBalance = await tx.stockBalance.findUnique({
          where: {
            productId_branchId_locationId: {
              productId,
              branchId: originBranchId,
              locationId: originLocationId
            }
          }
        });

        if (!originBalance || originBalance.quantity < quantity) {
          throw new Error('Saldo insuficiente no local de origem');
        }

        await tx.stockBalance.update({
          where: { id: originBalance.id },
          data: { quantity: originBalance.quantity - quantity }
        });
      }

      // 2. Creditar no Destino
      if (destinationBranchId && destinationLocationId) {
        const destinationBalance = await tx.stockBalance.findUnique({
          where: {
            productId_branchId_locationId: {
              productId,
              branchId: destinationBranchId,
              locationId: destinationLocationId
            }
          }
        });

        if (destinationBalance) {
          await tx.stockBalance.update({
            where: { id: destinationBalance.id },
            data: { quantity: destinationBalance.quantity + quantity }
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId,
              branchId: destinationBranchId,
              locationId: destinationLocationId,
              quantity
            }
          });
        }
      }

      // 3. Registrar Movimentação
      await tx.stockMovement.create({
        data: {
          productId,
          type: (originBranchId && destinationBranchId) ? 'TRANSFERENCIA' : (originBranchId ? 'SAIDA' : 'ENTRADA'),
          quantity,
          originBranchId,
          originLocationId,
          destinationBranchId,
          destinationLocationId,
          userId
        }
      });
    });

    res.status(200).json({ message: 'Movimentação realizada com sucesso' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao realizar movimentação' });
  }
};
