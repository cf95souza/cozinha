import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const branchGuard = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  if (req.user.role === 'ADMIN') {
    // Se o admin injetou um branchId específico na requisição, 
    // precisaremos validar nos controllers se esse branchId pertence ao companyId dele.
    // Mas para manter a retrocompatibilidade de listar TUDO quando não passa branchId:
    if (!req.query.branchId && !(req.body && req.body.branchId)) {
       return next();
    }
    // Se ele passou um branchId, deixamos passar, MAS os controllers DEVEM ter `companyId` no where.
    // (A correção está sendo aplicada diretamente nos controllers com o IDOR fix).
    return next();
  }

  // Se não for admin, força o branchId do token na query e no body
  if (req.user.branchId) {
    req.query.branchId = req.user.branchId;
    if (req.body && typeof req.body === 'object') {
      req.body.branchId = req.user.branchId;
    }
  } else {
    // Se não for admin e não tiver branchId, não deveria conseguir acessar nada por filial
    res.status(403).json({ error: 'Usuário não possui filial vinculada' });
    return;
  }

  next();
};
