import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { userService } from './user.service.js';

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body);
  res.status(201).json({ success: true, data: { user, token: user.id } });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});
