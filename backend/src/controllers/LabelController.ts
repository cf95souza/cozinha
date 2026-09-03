import { Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { AuthRequest } from '../middlewares/authMiddleware';

export class LabelController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { productId, lotId, userId } = req.body;

      if (!productId || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate a unique QR Code string
      const qrCode = `COZINHA-${crypto.randomUUID().split('-')[0]!.toUpperCase()}`;

      const label = await prisma.label.create({
        data: {
          productId,
          lotId,
          qrCode,
          generatedBy: userId,
        },
        include: {
          product: true,
          lot: true,
          user: true,
        },
      });

      let companyInfo = null;
      if (req.user?.companyId) {
        companyInfo = await prisma.company.findUnique({
          where: { id: req.user.companyId }
        });
      }

      return res.status(201).json({ ...label, company: companyInfo });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findByQrCode(req: AuthRequest, res: Response) {
    try {
      const qrCode = req.params.qrCode as string;

      const label = await prisma.label.findUnique({
        where: { qrCode },
        include: {
          product: {
            include: {
              category: true,
              location: true,
            }
          },
          lot: {
            include: {
              location: true,
            }
          },
          user: true,
        },
      });

      if (!label) {
        return res.status(404).json({ error: 'Label not found' });
      }

      return res.status(200).json(label);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string;
      const skip = Number(req.query.skip) || 0;
      const take = Number(req.query.take) || 20;

      // Se branchId não vier na query, pegamos do usuário logado (BOLA mitigation)
      // Como a rota /labels não tem branchGuard explícito no index (usa global?), pegamos o que der
      // Na verdade, labels estão ligadas a Product que está em Company/Branch.
      // O modelo Label não tem branchId. Vamos buscar labels baseadas nos produtos da branch.

      const filter: any = {};
      if (branchId) {
        filter.product = { branchId };
      } else if (req.user?.companyId) {
        // Fallback pra company se branchId faltar
        filter.product = { companyId: req.user.companyId };
      }

      const [labels, total] = await Promise.all([
        prisma.label.findMany({
          where: filter,
          include: {
            product: {
              include: {
                category: true,
              }
            },
            user: {
              select: { name: true }
            }
          },
          orderBy: { generatedAt: 'desc' },
          skip,
          take,
        }),
        prisma.label.count({ where: filter })
      ]);

      return res.status(200).json({ data: labels, total });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
