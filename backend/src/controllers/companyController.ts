import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      res.status(404).json({ error: 'Empresa não encontrada' });
      return;
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId as string;
    const { name, tradeName, document, stateRegist, phone, email, address, city, state, zipCode, logoUrl, currencyCode, timezone, expirationAlertDays, requireReceivingApproval, defaultExpirationDays } = req.body;

    if (!name) {
      res.status(400).json({ error: 'O nome da empresa é obrigatório' });
      return;
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { name, tradeName, document, stateRegist, phone, email, address, city, state, zipCode, logoUrl, currencyCode, timezone, expirationAlertDays, requireReceivingApproval, defaultExpirationDays }
    });

    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
};
