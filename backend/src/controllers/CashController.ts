import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class CashController {
  
  // ============================
  // CAIXAS (Cash Register)
  // ============================
  async listRegisters(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string || req.user?.branchId;
      if (!branchId) return res.status(400).json({ error: 'Branch missing' });

      const registers = await prisma.cashRegister.findMany({
        where: { branchId },
        include: {
          shifts: {
            where: { status: 'ABERTO' },
            include: { openedBy: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(registers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar caixas' });
    }
  }

  async createRegister(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const branchId = req.user?.branchId;
      const companyId = req.user?.companyId;

      if (!branchId || !companyId || !name) return res.status(400).json({ error: 'Missing fields' });

      const register = await prisma.cashRegister.create({
        data: { name, branchId, companyId }
      });

      res.status(201).json(register);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao criar caixa' });
    }
  }

  // ============================
  // TURNOS (Cash Shift)
  // ============================
  async openShift(req: AuthRequest, res: Response) {
    try {
      const { cashRegisterId, initialBalance } = req.body;
      const userId = req.user?.id;

      if (!userId || !cashRegisterId) return res.status(400).json({ error: 'Missing fields' });

      const register = await prisma.cashRegister.findUnique({ where: { id: cashRegisterId } });
      if (!register) return res.status(404).json({ error: 'Caixa não encontrado' });
      if (register.status === 'ABERTO') return res.status(400).json({ error: 'Caixa já está aberto' });

      const result = await prisma.$transaction(async (tx) => {
        await tx.cashRegister.update({
          where: { id: cashRegisterId },
          data: { status: 'ABERTO' }
        });

        const shift = await tx.cashShift.create({
          data: {
            cashRegisterId,
            openedById: userId,
            initialBalance: parseFloat(initialBalance || 0),
            status: 'ABERTO'
          }
        });

        return shift;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao abrir caixa' });
    }
  }

  async closeShift(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // cashShiftId
      const { finalBalance } = req.body;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const shift = await prisma.cashShift.findUnique({
        where: { id },
        include: { movements: true, cashRegister: true }
      });

      if (!shift) return res.status(404).json({ error: 'Turno não encontrado' });
      if (shift.status === 'FECHADO') return res.status(400).json({ error: 'Turno já está fechado' });

      // Calcular o total real que deveria ter no caixa
      // initial + suprimento - sangria + vendas (dinheiro apenas, mas o PDV deve somar aqui)
      // Neste modelo, o PDV vai gerar CashMovements do tipo 'VENDA' em dinheiro para somar.
      let expectedBalance = shift.initialBalance;
      shift.movements.forEach(m => {
        if (m.type === 'SUPRIMENTO' || m.type === 'VENDA') expectedBalance += m.amount;
        if (m.type === 'SANGRIA') expectedBalance -= m.amount;
      });

      const difference = parseFloat(finalBalance) - expectedBalance;

      const result = await prisma.$transaction(async (tx) => {
        const closedShift = await tx.cashShift.update({
          where: { id },
          data: {
            status: 'FECHADO',
            closedById: userId,
            closedAt: new Date(),
            finalBalance: parseFloat(finalBalance),
            difference
          }
        });

        await tx.cashRegister.update({
          where: { id: shift.cashRegisterId },
          data: { status: 'FECHADO' }
        });

        return closedShift;
      });

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao fechar caixa' });
    }
  }

  // ============================
  // MOVIMENTAÇÕES (Sangria/Suprimento)
  // ============================
  async createMovement(req: AuthRequest, res: Response) {
    try {
      const { cashShiftId, type, amount, description } = req.body;
      const userId = req.user?.id;

      if (!userId || !cashShiftId || !type || !amount) {
        return res.status(400).json({ error: 'Missing fields' });
      }

      const shift = await prisma.cashShift.findUnique({ where: { id: cashShiftId } });
      if (!shift || shift.status === 'FECHADO') {
        return res.status(400).json({ error: 'Turno inválido ou fechado' });
      }

      const movement = await prisma.cashMovement.create({
        data: {
          cashShiftId,
          type, // SANGRIA, SUPRIMENTO
          amount: parseFloat(amount),
          description,
          userId
        }
      });

      res.status(201).json(movement);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao registrar movimento' });
    }
  }
}
