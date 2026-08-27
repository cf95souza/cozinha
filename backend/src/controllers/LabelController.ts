import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export class LabelController {
  async create(req: Request, res: Response) {
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

      return res.status(201).json(label);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findByQrCode(req: Request, res: Response) {
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
}
