import { login, logout, register } from '@/Controller/auth.controller';
import express, { Express } from 'express';

const AuthRouter = express.Router();

AuthRouter.post('/register', register);

AuthRouter.post('/login', login);

AuthRouter.post('/logout', logout);

export default AuthRouter;