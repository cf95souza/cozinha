import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createReceivingSchema, receivingItemSchema } from '../schemas/receivingSchema';
import { z } from 'zod';

export const getReceivings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, status } = req.query;
    const where: any = { companyId: req.user!.companyId };
    
    if (branchId) where.branchId = branchId as string;
    if (status) where.status = status as string;

    const receivings = await prisma.receiving.findMany({
      where,
      include: {
        supplier: true,
        user: { select: { id: true, name: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(receivings);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar recebimentos' });
  }
};

export const createReceiving = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, id: userId } = req.user!;
    const validatedData = createReceivingSchema.parse(req.body);
    const { invoice, supplierId, branchId, notes, items } = validatedData;

    const receiving = await prisma.receiving.create({
      data: {
        invoice,
        supplierId,
        branchId,
        companyId,
        userId,
        notes,
        status: 'AGUARDANDO_CONFERENCIA',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            requestedQty: item.requestedQty,
            unit: item.unit
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json(receiving);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: 'Erro ao criar recebimento' });
    }
  }
};

export const getReceivingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    const receiving = await prisma.receiving.findUnique({
      where: { id, companyId },
      include: {
        supplier: true,
        user: { select: { name: true } },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!receiving) {
      res.status(404).json({ error: 'Recebimento não encontrado' });
      return;
    }

    res.json(receiving);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar recebimento' });
  }
};

export const updateReceivingItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;
    const validatedData = receivingItemSchema.partial().parse(req.body);
    const { receivedQty, lotNumber, expirationDate, temperature, packageStatus, brand, notes } = validatedData;

    // First ensure the receiving belongs to the company and is at least in EM_CONFERENCIA
    const rec = await prisma.receiving.findUnique({ where: { id, companyId } });
    if (!rec) {
      res.status(404).json({ error: 'Recebimento não encontrado' });
      return;
    }
    if (rec.status === 'AGUARDANDO_CONFERENCIA') {
      await prisma.receiving.update({ where: { id }, data: { status: 'EM_CONFERENCIA' } });
    }

    const item = await prisma.receivingItem.update({
      where: { id: itemId },
      data: {
        receivedQty: receivedQty === '' || receivedQty == null ? null : Number(receivedQty),
        lotNumber,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        temperature: temperature === '' || temperature == null ? null : Number(temperature),
        packageStatus,
        brand,
        notes
      }
    });

    res.json(item);
  } catch (error: any) {
    console.error('Erro ao atualizar item do recebimento:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: error.message || 'Erro ao atualizar item do recebimento' });
    }
  }
};

export const approveReceiving = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    
    const receiving = await prisma.receiving.findUnique({
      where: { id, companyId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!receiving) {
      res.status(404).json({ error: 'Recebimento não encontrado' });
      return;
    }

    if (receiving.status === 'APROVADO' || receiving.status === 'APROVADO_RESSALVA') {
      res.status(400).json({ error: 'Recebimento já foi aprovado anteriormente' });
      return;
    }

    // Processa a aprovação em Transaction
    await prisma.$transaction(async (tx) => {
      let hasDivergence = false;

      for (const item of receiving.items) {
        if (item.receivedQty == null || item.receivedQty === 0) continue;

        if (item.receivedQty !== item.requestedQty) {
          hasDivergence = true;
        }

        const locationIdToUse = item.product.locationId;
        if (!locationIdToUse) {
          throw new Error(`O produto "${item.product.name}" não tem um Local de Estoque Padrão configurado no cadastro de produtos. Edite o produto e defina o Local antes de aprovar a nota.`);
        }

        // 1. Gera Lote se for Controlado ou se vier LotNumber preenchido
        let lotId = null;
        if (item.product.controlled || item.lotNumber || item.expirationDate) {
          const generatedLotNumber = item.lotNumber || `LT-${new Date().getTime().toString().slice(-6)}`;
          
          const lot = await tx.lot.create({
            data: {
              number: generatedLotNumber,
              productId: item.productId,
              supplierId: receiving.supplierId,
              receivingId: receiving.id,
              expirationDate: item.expirationDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default 1 year if missing
              initialQty: item.receivedQty,
              currentQty: item.receivedQty,
              branchId: receiving.branchId,
              locationId: locationIdToUse,
              status: 'NORMAL'
            }
          });
          lotId = lot.id;
        }

        // 2. Adiciona ao Estoque
        const destinationBalance = await tx.stockBalance.findUnique({
          where: {
            productId_branchId_locationId: {
              productId: item.productId,
              branchId: receiving.branchId,
              locationId: locationIdToUse
            }
          }
        });

        if (destinationBalance) {
          await tx.stockBalance.update({
            where: { id: destinationBalance.id },
            data: { quantity: destinationBalance.quantity + item.receivedQty }
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId: item.productId,
              branchId: receiving.branchId,
              locationId: locationIdToUse,
              quantity: item.receivedQty
            }
          });
        }

        // 3. Log de Movimentação
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'ENTRADA',
            quantity: item.receivedQty,
            destinationBranchId: receiving.branchId,
            destinationLocationId: locationIdToUse,
            userId: req.user!.id
          }
        });
      }

      // 4. Atualiza Status
      await tx.receiving.update({
        where: { id },
        data: {
          status: hasDivergence ? 'APROVADO_RESSALVA' : 'APROVADO'
        }
      });
    });

    res.json({ message: 'Recebimento aprovado e estoque alimentado com sucesso' });
  } catch (error: any) {
    console.error('Erro na aprovação do recebimento:', error);
    res.status(400).json({ error: error.message || 'Erro ao aprovar recebimento' });
  }
};
