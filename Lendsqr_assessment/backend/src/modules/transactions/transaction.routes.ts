import { Router } from 'express';
import { fauxAuth } from '../auth/fauxAuth.middleware.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { getTransaction, listTransactions } from './transaction.controller.js';
import { listTransactionsSchema, transactionIdSchema } from './transaction.validation.js';

export const transactionRoutes = Router();

transactionRoutes.use(fauxAuth);
transactionRoutes.get('/', validateRequest(listTransactionsSchema), listTransactions);
transactionRoutes.get('/:id', validateRequest(transactionIdSchema), getTransaction);
