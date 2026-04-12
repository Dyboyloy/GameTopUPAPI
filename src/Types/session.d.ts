import session from "express-session";

interface CustomSessionData {
    user?: {
        id: string;
        username: string;
        role: 'USER' | 'ADMIN';
    };
}

declare module "express-session" {
    interface SessionData extends CustomSessionData {}
}

export {};