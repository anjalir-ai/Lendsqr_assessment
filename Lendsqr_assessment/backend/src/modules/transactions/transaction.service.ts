import { AppError } from '../../shared/errors/AppError.js';
import { walletRepository, type WalletRepository } from '../wallets/wallet.repository.js';
import { transactionRepository, type TransactionRepository } from './transaction.repository.js';
import type { Transaction } from './transaction.types.js';

export class TransactionService {
  constructor(
    private readonly transactions: TransactionRepository = transactionRepository,
    private readonly wallets: WalletRepository = walletRepository
  ) {}

  async list(userId: string, page: number, limit: number): Promise<{ data: Transaction[]; page: number; limit: number; total: number }> {
    const wallet = await this.wallets.findByUserId(userId);
    if (!wallet) throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    const result = await this.transactions.listByWallet(wallet.id, page, limit);
    return { ...result, page, limit };
  }

  async get(userId: string, id: string): Promise<Transaction> {
    const wallet = await this.wallets.findByUserId(userId);
    if (!wallet) throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    const transaction = await this.transactions.findById(id);
    if (!transaction) throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    if (transaction.wallet_id !== wallet.id) throw new AppError(403, 'Cannot access another user transaction', 'FORBIDDEN_TRANSACTION');
    return transaction;
  }
}

export const transactionService = new TransactionService();
