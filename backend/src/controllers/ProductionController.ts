import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ProductionController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { recipeId, plannedQuantity, producedQuantity, notes } = req.body;
      const branchId = req.user?.branchId;
      const userId = req.user?.id;

      if (!branchId || !userId) return res.status(400).json({ error: 'Auth context missing' });
      if (!recipeId || !plannedQuantity || !producedQuantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Fetch recipe
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: { items: true, product: true }
      });

      if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

      const yieldPercentage = (Number(producedQuantity) / Number(plannedQuantity)) * 100;
      const scaleFactor = Number(plannedQuantity) / recipe.expectedYield;

      // Transaction
      const result = await prisma.$transaction(async (tx: any) => {
        const consumedIngredientsData = [];

        // 1. Consumir Ingredientes (FIFO)
        for (const item of recipe.items) {
          const requiredQty = item.quantity * scaleFactor;
          let remainingQty = requiredQty;

          // Find lots ordered by expiration date
          const lots = await tx.lot.findMany({
            where: {
              productId: item.ingredientId,
              branchId,
              currentQty: { gt: 0 }
            },
            orderBy: { expirationDate: 'asc' }
          });

          for (const lot of lots) {
            if (remainingQty <= 0) break;

            const deductQty = Math.min(lot.currentQty, remainingQty);
            remainingQty -= deductQty;

            // Update lot
            await tx.lot.update({
              where: { id: lot.id },
              data: { currentQty: { decrement: deductQty } }
            });

            // Update balance
            await tx.stockBalance.updateMany({
              where: { productId: item.ingredientId, branchId, locationId: lot.locationId },
              data: { quantity: { decrement: deductQty } }
            });

            // Stock movement
            await tx.stockMovement.create({
              data: {
                productId: item.ingredientId,
                type: 'PRODUCAO_CONSUMO',
                quantity: deductQty,
                originBranchId: branchId,
                originLocationId: lot.locationId,
                userId
              }
            });

            consumedIngredientsData.push({
              ingredientId: item.ingredientId,
              lotId: lot.id,
              quantity: deductQty
            });
          }

          if (remainingQty > 0) {
            throw new Error(`Estoque insuficiente para o ingrediente ID: ${item.ingredientId}`);
          }
        }

        // 2. Criar registro de Produção
        const production = await tx.production.create({
          data: {
            branchId,
            recipeId,
            productId: recipe.productId,
            plannedQuantity: Number(plannedQuantity),
            producedQuantity: Number(producedQuantity),
            yieldPercentage,
            userId,
            notes,
            ingredients: {
              create: consumedIngredientsData
            }
          }
        });

        // 3. Dar Entrada no Produto Final
        // Find default location for product or fallback to first location in branch
        let locationId = recipe.product.locationId;
        if (!locationId) {
          const firstLoc = await tx.location.findFirst({ where: { branchId } });
          if (!firstLoc) throw new Error('No storage location found in branch');
          locationId = firstLoc.id;
        }

        // Create a new Lot for the produced item
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 3); // Default 3 days validity

        // Generate simple Lot number (PRD-YYYYMMDD-HHMM)
        const d = new Date();
        const lotNumber = `PRD-${d.toISOString().split('T')[0]!.replace(/-/g, '')}-${d.getHours()}${d.getMinutes()}`;

        const newLot = await tx.lot.create({
          data: {
            number: lotNumber,
            productId: recipe.productId,
            expirationDate: expDate,
            initialQty: Number(producedQuantity),
            currentQty: Number(producedQuantity),
            branchId,
            locationId
          }
        });

        // Update balance
        const existingBalance = await tx.stockBalance.findUnique({
          where: { productId_branchId_locationId: { productId: recipe.productId, branchId, locationId } }
        });

        if (existingBalance) {
          await tx.stockBalance.update({
            where: { id: existingBalance.id },
            data: { quantity: { increment: Number(producedQuantity) } }
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId: recipe.productId,
              branchId,
              locationId,
              quantity: Number(producedQuantity)
            }
          });
        }

        // Stock movement for entry
        await tx.stockMovement.create({
          data: {
            productId: recipe.productId,
            type: 'PRODUCAO_ENTRADA',
            quantity: Number(producedQuantity),
            destinationBranchId: branchId,
            destinationLocationId: locationId,
            userId
          }
        });

        return production;
      });

      return res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({ error: error.message || 'Internal server error' });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branchId;
      const productions = await prisma.production.findMany({
        where: branchId ? { branchId } : {},
        include: { product: true, recipe: true, user: true },
        orderBy: { finishedAt: 'desc' }
      });
      return res.status(200).json(productions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
