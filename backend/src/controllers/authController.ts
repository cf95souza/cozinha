import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/authMiddleware';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'development_refresh_key';

import { sendTelegramAlert } from '../lib/telegram';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Check brute-force lock
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      res.status(403).json({ error: 'Conta bloqueada temporariamente. Tente novamente mais tarde.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    const anyUser = user as any;

    if (!passwordMatch) {
      // Increment failed attempts
      const newAttempts = anyUser.failedLoginAttempts + 1;
      let lockedUntil = null;
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        // Disparar Alerta de Segurança no Telegram
        const companyName = user.company?.name || 'Sistema';
        await sendTelegramAlert(`🚨 *Alerta de Segurança*\nForam detectadas 5 tentativas incorretas de senha para o e-mail \`${email}\` na empresa *${companyName}*.\nA conta foi temporariamente bloqueada por 15 minutos.`);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          failedLoginAttempts: newAttempts,
          lockedUntil
        } as any
      });

      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Reset attempts on successful login
    if (anyUser.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null } as any
      });
    }

    const payload = { 
      id: user.id, 
      role: user.role, 
      companyId: user.companyId,
      branchId: user.branchId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company.name,
        branchId: user.branchId
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token não fornecido' });
      return;
    }

    jwt.verify(refreshToken, REFRESH_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Refresh token inválido ou expirado' });
      }

      // Check if user still exists and is ATIVO
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user || user.status === 'INATIVO') {
        return res.status(403).json({ error: 'Usuário inativo ou não encontrado. Acesso revogado.' });
      }

      // Check brute-force lock
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        return res.status(403).json({ error: 'Conta bloqueada temporariamente. Tente novamente mais tarde.' });
      }

      const payload = { 
        id: user.id, 
        role: user.role, 
        companyId: user.companyId,
        branchId: user.branchId
      };

      const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      res.json({ token: newToken });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      res.json({ message: 'Se o email existir, um link de recuperação foi enviado.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires } as any
    });
    
    console.log(`\n\n[REDEFINIÇÃO DE SENHA] Um pedido de redefinição foi feito para: ${email}`);
    console.log(`Acesse: http://localhost:5173/reset-password?token=${resetToken}\n\n`);

    res.json({ message: 'Se o email existir, um link de recuperação foi enviado.' });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      } as any
    });

    if (!user) {
      res.status(400).json({ error: 'Token inválido ou expirado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null
      } as any
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      console.error('ResetPassword error:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      res.status(400).json({ error: 'Senha atual incorreta' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    } else {
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }
};

export const seed = async (req: Request, res: Response): Promise<void> => {
  try {
    const seedSecret = process.env.SEED_SECRET;
    const providedSecret = req.headers['x-seed-secret'];

    if (!seedSecret || providedSecret !== seedSecret) {
      res.status(403).json({ error: 'Acesso negado ao endpoint de seed.' });
      return;
    }

    const companyCount = await prisma.company.count();
    
    if (companyCount > 0) {
      res.status(400).json({ error: 'Sistema já inicializado.' });
      return;
    }

    const company = await prisma.company.create({
      data: { name: 'Restaurante Exemplo (Matriz)' }
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@cozinha.com',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id
      }
    });

    res.status(201).json({ 
      message: 'Sistema inicializado com sucesso', 
      user: { email: user.email } 
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Erro ao inicializar o sistema' });
  }
};
