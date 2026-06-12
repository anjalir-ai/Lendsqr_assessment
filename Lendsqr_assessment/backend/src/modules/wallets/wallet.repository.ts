import type { Knex } from 'knex';
import { db } from '../../config/knex.js';
import type { Wallet } from './wallet.types.js';

export class WalletRepository {
  constructor(private readonly database: Knex = db) {}

  findByUserId(userId: string, trx?: Knex.Transaction): Promise<Wallet | undefined> {
    return (trx ?? this.database)<Wallet>('wallets').where({ user_id: userId }).first();
  }

  findById(id: string, trx?: Knex.Transaction): Promise<Wallet | undefined> {
    return (trx ?? this.database)<Wallet>('wallets').where({ id }).first();
  }

  findByUserIdForUpdate(userId: string, trx: Knex.Transaction): Promise<Wallet | undefined> {
    return trx<Wallet>('wallets').where({ user_id: userId }).forUpdate().first();
  }

  findByIdForUpdate(id: string, trx: Knex.Transaction): Promise<Wallet | undefined> {
    return trx<Wallet>('wallets').where({ id }).forUpdate().first();
  }

  async create(data: Omit<Wallet, 'created_at' | 'updated_at'>, trx: Knex.Transaction): Promise<Wallet> {
    await trx<Wallet>('wallets').insert(data);
    const wallet = await trx<Wallet>('wallets').where({ id: data.id }).first();
    if (!wallet) throw new Error('Failed to create wallet');
    return wallet;
  }

  updateBalance(id: string, balance: number, trx: Knex.Transaction): Promise<number> {
    return trx<Wallet>('wallets').where({ id }).update({ balance, updated_at: trx.fn.now() });
  }
}

export const walletRepository = new WalletRepository();
