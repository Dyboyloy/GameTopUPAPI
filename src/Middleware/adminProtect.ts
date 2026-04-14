import { NextFunction, Request, Response } from 'express';

export const adminProtect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if ((req.session as any) && (req.session as any).user) {
            const user = (req.session as any).user;
            if (user.role === 'ADMIN') {
                return next();
            } else {
                return res.status(403).json({ status: 'error', message: 'Forbidden: Admins only' });
            }
        }
    } catch (error) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: Admins only' });
    }
}