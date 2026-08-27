import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './authMiddleware';

export const auditMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // We only log modifying methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Wait for the request to finish to ensure it was successful
    res.on('finish', async () => {
      // Only log if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user?.id || 'system';
          const branchId = (req.headers['x-branch-id'] as string) || null;
          const entity = req.baseUrl.split('/').pop() || 'unknown';
          
          await prisma.auditLog.create({
            data: {
              userId,
              branchId,
              action: req.method,
              entity: entity.toUpperCase(),
              entityId: (req.params.id as string) || 'N/A',
              details: {
                url: req.originalUrl,
                body: req.method !== 'DELETE' ? req.body : undefined,
                query: req.query
              }
            }
          });
        } catch (error) {
          console.error('Failed to write audit log:', error);
        }
      }
    });
  }
  next();
};
