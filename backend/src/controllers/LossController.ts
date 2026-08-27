import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createLossSchema } from '../schemas/lossSchema';

export class LossController {
  async create(req: AuthRequest, res: Response) {
    try {
      const validatedData = createLossSchema.parse(req.body);
      const { productId, lotId, quantity, unit, reason, locationId, branchId, photoUrl, notes } = validatedData;
      // Note: req.user should ideally be used for userId, but sticking to existing logic if userId is expected from frontend (which is bad, but for now we fallback)
      const userId = req.body.userId || req.user?.id;

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the loss record
        const loss = await tx.loss.create({
          data: {
            productId,
            lotId,
            quantity: Number(quantity),
            unit,
            reason,
            locationId,
            branchId,
            userId,
            photoUrl,
            notes,
          },
        });

        // 2. Adjust stock balance if locationId is provided (otherwise it's a global loss without specific location logic depending on architecture)
        // Since MVP states location is required for stock balance:
        if (locationId) {
          const balance = await tx.stockBalance.findUnique({
            where: {
              productId_branchId_locationId: {
                productId,
                branchId,
                locationId,
              },
            },
          });

          if (balance) {
            await tx.stockBalance.update({
              where: { id: balance.id },
              data: { quantity: balance.quantity - Number(quantity) },
            });
          }
        }

        // 3. Create stock movement
        await tx.stockMovement.create({
          data: {
            productId,
            type: 'SAIDA_PERDA',
            quantity: Number(quantity),
            originBranchId: branchId,
            originLocationId: locationId,
            userId,
          },
        });

        return loss;
      });

      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const { branchId } = req.query;

      const losses = await prisma.loss.findMany({
        where: branchId ? { branchId: String(branchId) } : undefined,
        include: {
          product: true,
          lot: true,
          user: true,
        },
        orderBy: { date: 'desc' },
      });

      return res.status(200).json(losses);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
