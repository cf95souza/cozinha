import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class FinanceCategoryController {
  async list(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(400).json({ error: 'Company missing' });

      const type = req.query.type as string;

      const categories = await prisma.financialCategory.findMany({
        where: { 
          companyId,
          ...(type ? { type } : {})
        },
        orderBy: { name: 'asc' }
      });

      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar categorias financeiras' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, type } = req.body;
      const companyId = req.user?.companyId;

      if (!companyId || !name || !type) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const category = await prisma.financialCategory.create({
        data: { name, type, companyId }
      });

      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao criar categoria financeira' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, type } = req.body;
      const companyId = req.user?.companyId;

      const category = await prisma.financialCategory.update({
        where: { id },
        data: { name, type }
      });

      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao atualizar categoria financeira' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      // Poderiamos verificar se há pagamentos atrelados
      const hasPayables = await prisma.payable.count({ where: { categoryId: id } });
      const hasReceivables = await prisma.receivable.count({ where: { categoryId: id } });
      
      if (hasPayables > 0 || hasReceivables > 0) {
        return res.status(400).json({ error: 'Categoria está em uso e não pode ser excluída' });
      }

      await prisma.financialCategory.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao deletar categoria financeira' });
    }
  }
}
