import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './shared/errors/errorHandler.js';
import { requestLogger } from './shared/middleware/requestLogger.js';
import { transactionRoutes } from './modules/transactions/transaction.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { walletRoutes } from './modules/wallets/wallet.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/transactions', transactionRoutes);

app.use(errorHandler);
