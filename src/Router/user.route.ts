import { deleteUserAccount, getUserProfile, updateUserProfile } from '@/Controller/user.controller';
import express, { Express } from 'express';

const UserRouter = express.Router();

UserRouter.get('/profile', getUserProfile);
UserRouter.patch('/profile', updateUserProfile);
UserRouter.delete('/profile', deleteUserAccount);

export default UserRouter;