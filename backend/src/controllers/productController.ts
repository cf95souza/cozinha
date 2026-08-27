import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { z } from 'zod';
import { createProductSchema, updateProductSchema } from '../schemas/productSchema';

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const { branchId, categoryId, page = '1', limit = '10' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = { companyId, status: 'ATIVO' };
    if (branchId) where.branchId = branchId as string;
    if (categoryId) where.categoryId = categoryId as string;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ 
        where,
        skip,
        take: limitNumber,
        include: {
          category: true,
          location: true,
          supplier: true,
          stockBalances: true
        }
      }),
      prisma.product.count({ where })
    ]);
    
    res.json({
      data: products,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const validatedData = createProductSchema.parse(req.body);

    const product = await prisma.product.create({
      data: { 
        ...validatedData,
        companyId 
      }
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: 'Erro ao criar produto' });
    }
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    const validatedData = updateProductSchema.parse(req.body);

    const product = await prisma.product.updateMany({
      where: { id, companyId },
      data: validatedData
    });

    if (product.count === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const updated = await prisma.product.findUnique({ where: { id } });
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const id = req.params.id as string;
    const result = await prisma.product.updateMany({ 
      where: { id, companyId },
      data: { status: 'INATIVO' }
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
};
