import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'development_secret_key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    companyId: string;
    branchId?: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido ou inválido' });
    return;
  }

  const token = authHeader.split(' ')[1] as string;

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      companyId: decoded.companyId,
      branchId: decoded.branchId
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token expirado ou inválido' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado para este perfil' });
      return;
    }

    next();
  };
};
