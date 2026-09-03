import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createInventorySchema } from '../schemas/inventorySchema';

export class InventoryController {
  async createSession(req: AuthRequest, res: Response) {
    try {
      // We will parse with a partial schema here since items are not passed in createSession
      const baseSchema = z.object({
        branchId: z.string().uuid(),
      });
      const validatedData = baseSchema.parse(req.body);
      const { branchId } = validatedData;
      const userId = req.body.userId || req.user?.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      const inventory = await prisma.inventory.create({
        data: {
          branchId,
          userId,
          status: 'PENDENTE',
        },
      });

      return res.status(201).json(inventory);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addItems(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { items } = req.body; // Array of { productId, theoreticalQuantity, physicalQuantity, notes }

      const inventory = await prisma.inventory.findUnique({ where: { id } });
      if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
      if (inventory.status !== 'PENDENTE') return res.status(400).json({ error: 'Inventory is not pending' });

      // Calculate difference and create items
      const itemsToCreate = items.map((item: any) => ({
        inventoryId: id,
        productId: item.productId,
        theoreticalQuantity: Number(item.theoreticalQuantity),
        physicalQuantity: Number(item.physicalQuantity),
        difference: Number(item.physicalQuantity) - Number(item.theoreticalQuantity),
        notes: item.notes,
      }));

      await prisma.inventoryItem.createMany({
        data: itemsToCreate,
      });

      return res.status(201).json({ message: 'Items added successfully' });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async approve(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { userId } = req.body;

      const inventory = await prisma.inventory.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
      if (inventory.status !== 'PENDENTE') return res.status(400).json({ error: 'Inventory already processed' });

      await prisma.$transaction(async (tx) => {
        // Update inventory status
        await tx.inventory.update({
          where: { id },
          data: { status: 'APROVADO', updatedAt: new Date() },
        });

        // Apply adjustments
        for (const item of inventory.items) {
          if (item.difference !== 0) {
            // Find location to adjust, assuming default or primary location for the branch for now,
            // or we could require location in inventory items. In this MVP, we fetch the first available balance
            // to adjust, or simply create an adjustment movement.
            const balance = await tx.stockBalance.findFirst({
              where: { productId: item.productId, branchId: inventory.branchId },
            });

            if (balance) {
              await tx.stockBalance.update({
                where: { id: balance.id },
                data: { quantity: balance.quantity + item.difference },
              });
            }

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'AJUSTE_INVENTARIO',
                quantity: item.difference, // positive or negative
                originBranchId: item.difference < 0 ? inventory.branchId : null,
                destinationBranchId: item.difference > 0 ? inventory.branchId : null,
                userId: userId || inventory.userId,
              }
            });
          }
        }
      });

      return res.status(200).json({ message: 'Inventory approved and stock adjusted' });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const { branchId } = req.query;
      const inventories = await prisma.inventory.findMany({
        where: branchId ? { branchId: String(branchId) } : undefined,
        include: { user: true, items: { include: { product: true } } },
        orderBy: { date: 'desc' },
      });
      return res.status(200).json(inventories);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const inventory = await prisma.inventory.findUnique({ where: { id } });
      
      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }
      
      if (inventory.status !== 'PENDENTE') {
        return res.status(400).json({ error: 'Apenas inventários PENDENTES podem ser excluídos' });
      }

      await prisma.inventory.delete({ where: { id } });
      
      return res.status(200).json({ message: 'Inventário excluído com sucesso' });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
