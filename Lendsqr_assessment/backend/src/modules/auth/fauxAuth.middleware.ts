import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { userRepository } from '../users/user.repository.js';

export const fauxAuth: RequestHandler = async (req, _res, next) => {
  try {
    const bearer = req.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    const userId = bearer ?? req.header('x-user-id');
    if (!userId) throw new AppError(401, 'Missing faux auth token', 'UNAUTHENTICATED');
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(401, 'Invalid faux auth token', 'UNAUTHENTICATED');
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
