import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class AuditController {
  async list(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const { page = '1', limit = '10' } = req.query;
      
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;
      
      const where = branchId ? { branchId } : {};
      
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNumber
        }),
        prisma.auditLog.count({ where })
      ]);
      
      res.json({
        data: logs,
        meta: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar auditoria' });
    }
  }
}
