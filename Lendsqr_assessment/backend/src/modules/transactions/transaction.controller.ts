import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { transactionService } from './transaction.service.js';

function userId(req: Request): string {
  if (!req.user) throw new AppError(401, 'Missing faux auth token', 'UNAUTHENTICATED');
  return req.user.id;
}

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await transactionService.list(userId(req), Number(req.query.page), Number(req.query.limit));
  res.json({ success: true, data: result });
});

export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.get(userId(req), String(req.params.id));
  res.json({ success: true, data: { transaction } });
});
