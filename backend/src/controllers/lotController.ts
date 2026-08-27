import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getLots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, status } = req.query;
    
    // Filtramos apenas lotes que ainda tenham quantidade > 0
    const where: any = { currentQty: { gt: 0 } };
    
    if (branchId) where.branchId = branchId as string;
    if (status) where.status = status as string;

    // Atualiza status dinamicamente no momento da busca com base na data (Para MVP)
    const now = new Date();
    const lotsRaw = await prisma.lot.findMany({
      where,
      include: {
        product: true,
        supplier: true,
        location: true
      },
      orderBy: { expirationDate: 'asc' }
    });

    const lots = lotsRaw.map(lot => {
      const diffTime = new Date(lot.expirationDate).getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let computedStatus = 'NORMAL';
      if (diffDays < 0) computedStatus = 'VENCIDO';
      else if (diffDays <= 2) computedStatus = 'URGENTE';
      else if (diffDays <= 7) computedStatus = 'ATENCAO';

      return { ...lot, computedStatus, daysToExpiration: diffDays };
    });

    res.json(lots);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lotes/validades' });
  }
};
