import { Router } from 'express';
import { fauxAuth } from '../auth/fauxAuth.middleware.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { createUser, getMe } from './user.controller.js';
import { createUserSchema } from './user.validation.js';

export const userRoutes = Router();

userRoutes.post('/', validateRequest(createUserSchema), createUser);
userRoutes.get('/me', fauxAuth, getMe);
