import type { Knex } from 'knex';
import { db } from '../../config/knex.js';
import type { Transaction } from './transaction.types.js';

export class TransactionRepository {
  constructor(private readonly database: Knex = db) {}

  async create(data: Omit<Transaction, 'created_at' | 'updated_at'>, trx: Knex.Transaction): Promise<Transaction> {
    await trx('transactions').insert({ ...data, metadata: data.metadata ? JSON.stringify(data.metadata) : null });
    const transaction = await trx<Transaction>('transactions').where({ id: data.id }).first();
    if (!transaction) throw new Error('Failed to create transaction');
    return transaction;
  }

  async listByWallet(walletId: string, page: number, limit: number): Promise<{ data: Transaction[]; total: number }> {
    const offset = (page - 1) * limit;
    const [{ count }] = await this.database<Transaction>('transactions').where({ wallet_id: walletId }).count<{ count: number | string }[]>({ count: '*' });
    const data = await this.database<Transaction>('transactions').where({ wallet_id: walletId }).orderBy('created_at', 'desc').limit(limit).offset(offset);
    return { data, total: Number(count) };
  }

  findById(id: string): Promise<Transaction | undefined> {
    return this.database<Transaction>('transactions').where({ id }).first();
  }
}

export const transactionRepository = new TransactionRepository();
