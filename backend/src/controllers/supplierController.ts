import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const { branchId, page = '1', limit = '10' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = { companyId, status: 'ATIVO' };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: limitNumber }),
      prisma.supplier.count({ where })
    ]);
    
    res.json({
      data: suppliers,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedores' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.user!;
    const { name, tradeName, document, contact, phone, email, address, city, state, zipCode, website, paymentTerms, deliveryDays, minimumOrder, notes, rating, status, branchId } = req.body;

    const supplier = await prisma.supplier.create({
      data: { name, tradeName, document: document || null, contact, phone, email, address, city, state, zipCode, website, paymentTerms: paymentTerms ? String(paymentTerms) : null, deliveryDays: deliveryDays ? String(deliveryDays) : null, minimumOrder: minimumOrder ? Number(minimumOrder) : null, notes, rating: rating ? Number(rating) : null, status, companyId, branchId: null }
    });

    res.status(201).json(supplier);
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Erro ao criar fornecedor', details: error.message || error });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, tradeName, document, contact, phone, email, address, city, state, zipCode, website, paymentTerms, deliveryDays, minimumOrder, notes, rating, status } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, tradeName, document: document || null, contact, phone, email, address, city, state, zipCode, website, paymentTerms: paymentTerms ? String(paymentTerms) : null, deliveryDays: deliveryDays ? String(deliveryDays) : null, minimumOrder: minimumOrder ? Number(minimumOrder) : null, notes, rating: rating ? Number(rating) : null, status }
    });

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.supplier.update({ 
      where: { id },
      data: { status: 'INATIVO' }
    });
    res.json({ message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir fornecedor' });
  }
};
