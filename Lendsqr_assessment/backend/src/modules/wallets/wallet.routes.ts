import { Router } from 'express';
import { fauxAuth } from '../auth/fauxAuth.middleware.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { fundWallet, getWallet, transferWallet, withdrawWallet } from './wallet.controller.js';
import { fundSchema, transferSchema, withdrawSchema } from './wallet.validation.js';

export const walletRoutes = Router();

walletRoutes.use(fauxAuth);
walletRoutes.get('/me', getWallet);
walletRoutes.post('/fund', validateRequest(fundSchema), fundWallet);
walletRoutes.post('/transfer', validateRequest(transferSchema), transferWallet);
walletRoutes.post('/withdraw', validateRequest(withdrawSchema), withdrawWallet);
