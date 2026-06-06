import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'ليس لديك صلاحية للوصول إلى هذه الميزة',
        messageEn: 'You do not have permission to access this feature',
      });
    }
    next();
  };
};

export const requireModule = (...modules: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userModules = req.enabledModules || [];
    const hasModule = modules.some(m => userModules.includes(m));
    if (req.userRole !== 'ADMIN' && !hasModule) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'هذه الميزة غير مفعلة. يمكنك تفعيلها من الإعدادات',
        messageEn: 'This feature is not enabled. You can enable it in settings.',
      });
    }
    next();
  };
};

export const requireGuardian = requireRole('GUARDIAN', 'BOTH', 'ADMIN');
export const requireGroom = requireRole('GROOM', 'BOTH', 'ADMIN');
export const requireAdmin = requireRole('ADMIN');
