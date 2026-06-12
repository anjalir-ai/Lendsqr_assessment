import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { fromMinorUnits } from '../../shared/utils/money.js';
import { walletService } from './wallet.service.js';

function userId(req: Request): string {
  if (!req.user) throw new AppError(401, 'Missing faux auth token', 'UNAUTHENTICATED');
  return req.user.id;
}

function walletPayload(wallet: { id: string; user_id: string; balance: number; currency: string }) {
  return { ...wallet, balanceMajor: fromMinorUnits(wallet.balance) };
}

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getByUserId(userId(req));
  res.json({ success: true, data: { wallet: walletPayload(wallet) } });
});

export const fundWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.fund(userId(req), req.body.amount, req.body.reference);
  res.json({ success: true, data: { wallet: walletPayload(wallet) } });
});

export const transferWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.transfer(userId(req), req.body.recipientUserId, req.body.amount, req.body.reference, req.body.description);
  res.json({ success: true, data: { wallet: walletPayload(wallet) } });
});

export const withdrawWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.withdraw(userId(req), req.body.amount, req.body.reference);
  res.json({ success: true, data: { wallet: walletPayload(wallet) } });
});
