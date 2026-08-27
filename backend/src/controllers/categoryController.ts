import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { categorySchema } from '../schemas/categorySchema';
import { z } from 'zod';

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const [categories, total] = await Promise.all([
      prisma.category.findMany({ where, skip, take: limitNumber }),
      prisma.category.count({ where })
    ]);
    
    res.json({
      data: categories,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const validatedData = categorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: { ...validatedData, companyId }
    });

    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    const validatedData = categorySchema.parse(req.body);

    const result = await prisma.category.updateMany({
      where: { id, companyId },
      data: validatedData
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }

    const category = await prisma.category.findUnique({ where: { id } });
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    
    const result = await prisma.category.updateMany({ 
      where: { id, companyId },
      data: { status: 'INATIVO' }
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }

    res.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
};
