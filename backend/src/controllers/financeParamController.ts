import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createCostCenterSchema, createInvoiceTypeSchema, createInvoiceOriginSchema } from '../schemas/financeSchema';
import { z } from 'zod';

export const getCostCenters = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.user!;
    const items = await prisma.costCenter.findMany({ where: { companyId, status: 'ATIVO' } });
    res.json(items);
  } catch (error) { res.status(500).json({ error: 'Erro' }); }
};

export const createCostCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.user!;
    const data = createCostCenterSchema.parse(req.body);
    const item = await prisma.costCenter.create({ data: { ...data, companyId } });
    res.status(201).json(item);
  } catch (error) { res.status(400).json({ error: 'Erro de validação' }); }
};

export const getInvoiceTypes = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.user!;
    const items = await prisma.invoiceType.findMany({ where: { companyId, status: 'ATIVO' } });
    res.json(items);
  } catch (error) { res.status(500).json({ error: 'Erro' }); }
};

export const createInvoiceType = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.user!;
    const data = createInvoiceTypeSchema.parse(req.body);
    const item = await prisma.invoiceType.create({ data: { ...data, companyId } });
    res.status(201).json(item);
  } catch (error) { res.status(400).json({ error: 'Erro de validação' }); }
};

export const getInvoiceOrigins = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.user!;
    const items = await prisma.invoiceOrigin.findMany({ where: { companyId, status: 'ATIVO' } });
    res.json(items);
  } catch (error) { res.status(500).json({ error: 'Erro' }); }
};

export const createInvoiceOrigin = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.user!;
    const data = createInvoiceOriginSchema.parse(req.body);
    const item = await prisma.invoiceOrigin.create({ data: { ...data, companyId } });
    res.status(201).json(item);
  } catch (error) { res.status(400).json({ error: 'Erro de validação' }); }
};
