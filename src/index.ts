import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import { prisma } from './Lib/PrismaClient';
import "dotenv/config";
import AuthRouter from './Router/auth.route';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import UserRouter from './Router/user.route';
import ProductRouter from './Router/product.route';

declare module 'express-session' {
    interface SessionData {
        views: number;
    }
}

const app: Express = express();

app.use(cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(expressSession({
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 24 * 60 * 60 * 1000, // 1 day
        dbRecordIdIsSessionId: true,
    }),
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));


// Routes
app.use('/api/v1/auth', AuthRouter);
app.use('/api/v1/users', UserRouter);
app.use('/api/v1/products', ProductRouter);

// Check DB connection
app.get('/health', async (req, res) => {
    try {      // @ts-ignore
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});