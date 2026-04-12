import { Request, Response, NextFunction } from "express";
import { prisma } from "../Lib/PrismaClient";
import { z } from "zod";
import bcrypt from "bcrypt";

const Profile = z.object({
    displayName: z.string().min(1).max(50),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
    avatarUrl: z.string()
});

const registerSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string(),
    profile: z.array(Profile.optional()).optional(),
    password: z.string().min(6).max(100)
});

const loginSchema = z.object({
    identifier: z.string(),
    password: z.string().min(6).max(100)
});

interface profileData {
    displayName: string;
    role: "USER" | "ADMIN";
    avatarUrl: string;
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, email, profile, password } = registerSchema.parse(req.body);
        
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Username or email already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
            include: {
                profile: true
            }
        });

        if (profile && profile.length > 0) {
            await prisma.profile.createMany({
                data: profile.filter((p): p is profileData => p !== undefined).map(p => ({
                    displayName: p.displayName,
                    role: p.role,
                    avatarUrl: p.avatarUrl,
                    userId: user.id
                }))
            });
        }

        (req.session as any).user = { id: user.id, username: user.username };

        res.status(201).json({ message: "User registered successfullly"}); 
    } catch (error) {
        return res.status(500).json({ message: "Registration failed", error: error instanceof Error ? error.message : String(error) });
    }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { identifier, password } = loginSchema.parse(req.body);
        
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid username/email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid username/email or password" });
        }


        // set session
        (req.session as any).user = { id: user.id, username: user.username };

        res.status(200).json({ message: "Login successful" });
    }
    catch (error) {
        return res.status(500).json({ message: "Login failed", error: error instanceof Error ? error.message : String(error) });
    }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed", error: err instanceof Error ? err.message : String(err) });
        }
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout successful" });
    });
};
