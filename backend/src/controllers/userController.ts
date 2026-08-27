import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;
    if (!companyId) throw new Error('Company required');

    const users = await prisma.user.findMany({
      where: { companyId, status: 'ATIVO' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        branch: { select: { name: true } },
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;
    const requesterRole = req.user?.role;
    const { name, email, password, role, branchId } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      return;
    }

    if (role !== 'ADMIN' && !branchId) {
      res.status(400).json({ error: 'A unidade de lotação é obrigatória para este perfil' });
      return;
    }

    // Apenas ADMIN pode criar usuários com perfil ADMIN
    if (role === 'ADMIN' && requesterRole !== 'ADMIN') {
      res.status(403).json({ error: 'Apenas administradores podem criar perfis ADMIN' });
      return;
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      res.status(400).json({ error: 'E-mail já está em uso' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        branchId: branchId || null,
        companyId: companyId!,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;
    const id = req.params.id as string;

    if (id === req.user?.id) {
      res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.companyId !== companyId) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    await prisma.user.update({ 
      where: { id },
      data: { status: 'INATIVO' }
    });

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
};
