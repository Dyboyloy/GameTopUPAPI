import { Request, Response, NextFunction } from 'express';
import { prisma } from '../Lib/PrismaClient';
import { z } from 'zod';

// Get user profile
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usserId = (req.session as any).user?.id;
        if (!usserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: usserId },
            select: {
                id: true,
                username: true,
                email: true,
                profile: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        return res.status(500).json({ status: 'error', message: (error as Error).message });
    }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.session as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const updateProfileSchema = z.object({
            displayName: z.string().optional(),
            avatarUrl: z.string().url().optional(),
        });

        const { displayName, avatarUrl } = updateProfileSchema.parse(req.body);

        const updatedProfile = await prisma.profile.update({
            where: { userId },
            data: {
                displayName,
                avatarUrl,
            }
        });

        res.json(updatedProfile);
    } catch (error) {
        return res.status(500).json({ status: 'error', message: (error as Error).message });
    }
};

export const deleteUserAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.session as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
        });

        res.json({ message: 'User account deleted successfully' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: (error as Error).message });
    }
};