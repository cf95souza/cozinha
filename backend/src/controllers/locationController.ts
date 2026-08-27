import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { locationSchema } from '../schemas/locationSchema';
import { z } from 'zod';

export const getLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const { branchId, page = '1', limit = '10' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = { companyId, status: 'ATIVO' };
    if (branchId) {
      where.branchId = branchId as string;
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({ where, skip, take: limitNumber }),
      prisma.location.count({ where })
    ]);
    
    res.json({
      data: locations,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar locais de armazenamento' });
  }
};

export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const validatedData = locationSchema.parse(req.body);

    const location = await prisma.location.create({
      data: { ...validatedData, companyId }
    });

    res.status(201).json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: 'Erro ao criar local de armazenamento' });
    }
  }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    const validatedData = locationSchema.parse(req.body);

    const result = await prisma.location.updateMany({
      where: { id, companyId },
      data: validatedData
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Local não encontrado' });
      return;
    }

    const location = await prisma.location.findUnique({ where: { id } });
    res.json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar local de armazenamento' });
    }
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    
    const result = await prisma.location.updateMany({ 
      where: { id, companyId },
      data: { status: 'INATIVO' }
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Local não encontrado' });
      return;
    }

    res.json({ message: 'Local de armazenamento excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir local de armazenamento' });
  }
};
