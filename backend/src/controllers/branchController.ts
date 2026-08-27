import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getBranches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;

    const branches = await prisma.branch.findMany({
      where: { companyId, status: 'ATIVO' }
    });

    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Erro ao buscar unidades' });
  }
};

export const createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;
    const { name, tradeName, document, phone, email, address, city, state, zipCode, managerName, type, status } = req.body;

    if (!name) {
      res.status(400).json({ error: 'O nome da unidade é obrigatório' });
      return;
    }

    const newBranch = await prisma.branch.create({
      data: {
        name, tradeName, document, phone, email, address, city, state, zipCode, managerName, type, status,
        companyId: companyId!,
      }
    });

    res.status(201).json(newBranch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Erro ao criar unidade' });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;
    const id = req.params.id as string;
    const { name, tradeName, document, phone, email, address, city, state, zipCode, managerName, type, status } = req.body;

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch || branch.companyId !== companyId) {
      res.status(404).json({ error: 'Unidade não encontrada' });
      return;
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: { name, tradeName, document, phone, email, address, city, state, zipCode, managerName, type, status }
    });

    res.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Erro ao atualizar unidade' });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;
    const id = req.params.id as string;

    const branch = await prisma.branch.findUnique({ where: { id } });

    if (!branch || branch.companyId !== companyId) {
      res.status(404).json({ error: 'Unidade não encontrada' });
      return;
    }

    // Opcional: Impedir exclusão se houver usuários ou produtos
    const usersCount = await prisma.user.count({ where: { branchId: id } });
    if (usersCount > 0) {
      res.status(400).json({ error: 'Não é possível excluir uma unidade que possui usuários vinculados.' });
      return;
    }

    await prisma.branch.delete({ where: { id } });

    res.json({ message: 'Unidade excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Erro ao excluir unidade' });
  }
};
