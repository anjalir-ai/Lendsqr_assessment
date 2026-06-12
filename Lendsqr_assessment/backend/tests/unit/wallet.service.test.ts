import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletService } from '../../src/modules/wallets/wallet.service.js';
import type { TransactionRepository } from '../../src/modules/transactions/transaction.repository.js';
import type { UserRepository } from '../../src/modules/users/user.repository.js';
import type { WalletRepository } from '../../src/modules/wallets/wallet.repository.js';
import type { Transaction } from '../../src/modules/transactions/transaction.types.js';
import type { User } from '../../src/modules/users/user.types.js';
import type { Wallet } from '../../src/modules/wallets/wallet.types.js';

vi.mock('../../src/config/knex.js', () => ({
  db: { transaction: async <T>(callback: (trx: { fn: { now: () => Date } }) => Promise<T>) => callback({ fn: { now: () => new Date() } }) }
}));

const now = new Date();
const sender: Wallet = { id: 'wallet-a', user_id: 'user-a', balance: 10000, currency: 'NGN', created_at: now, updated_at: now };
const recipient: Wallet = { id: 'wallet-b', user_id: 'user-b', balance: 1000, currency: 'NGN', created_at: now, updated_at: now };
const recipientUser: User = { id: 'user-b', first_name: 'B', last_name: 'Demo', email: 'b@example.com', phone: null, bvn: null, created_at: now, updated_at: now };

describe('WalletService', () => {
  let balances: Record<string, number>;
  let transactions: Transaction[];
  let wallets: WalletRepository;
  let txRepo: TransactionRepository;
  let users: UserRepository;

  beforeEach(() => {
    balances = { 'wallet-a': sender.balance, 'wallet-b': recipient.balance };
    transactions = [];
    wallets = {
      findByUserId: vi.fn(async (userId: string) => (userId === 'user-a' ? { ...sender, balance: balances['wallet-a'] } : { ...recipient, balance: balances['wallet-b'] })),
      findByUserIdForUpdate: vi.fn(async (userId: string) => (userId === 'user-a' ? { ...sender, balance: balances['wallet-a'] } : { ...recipient, balance: balances['wallet-b'] })),
      updateBalance: vi.fn(async (id: string, balance: number) => {
        balances[id] = balance;
        return 1;
      })
    } as unknown as WalletRepository;
    txRepo = {
      create: vi.fn(async (data: Transaction) => {
        transactions.push(data);
        return data;
      })
    } as unknown as TransactionRepository;
    users = { findById: vi.fn(async () => recipientUser) } as unknown as UserRepository;
  });

  it('funds wallet and records transaction', async () => {
    const service = new WalletService(wallets, txRepo, users);
    const wallet = await service.fund('user-a', '25.50', 'ref-fund');

    expect(wallet.balance).toBe(12550);
    expect(transactions[0].type).toBe('FUND');
    expect(transactions[0].amount).toBe(2550);
  });

  it('withdraws wallet and rejects insufficient balance', async () => {
    const service = new WalletService(wallets, txRepo, users);
    const wallet = await service.withdraw('user-a', '40.00', 'ref-withdraw');

    expect(wallet.balance).toBe(6000);
    expect(transactions[0].type).toBe('WITHDRAWAL');
    await expect(service.withdraw('user-a', '1000.00')).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
  });

  it('transfers atomically at service boundary and creates linked records', async () => {
    const service = new WalletService(wallets, txRepo, users);
    const wallet = await service.transfer('user-a', 'user-b', '30.00', 'ref-transfer');

    expect(wallet.balance).toBe(7000);
    expect(balances['wallet-b']).toBe(4000);
    expect(transactions).toHaveLength(2);
    expect(transactions.map((tx) => tx.type)).toEqual(['TRANSFER_OUT', 'TRANSFER_IN']);
    expect(transactions[0].transfer_group).toBe(transactions[1].transfer_group);
  });

  it('rejects self-transfer, nonexistent recipient, and invalid amount', async () => {
    const service = new WalletService(wallets, txRepo, users);

    await expect(service.transfer('user-a', 'user-a', '1.00')).rejects.toMatchObject({ code: 'SELF_TRANSFER' });
    users.findById = vi.fn(async () => undefined);
    await expect(service.transfer('user-a', 'missing', '1.00')).rejects.toMatchObject({ code: 'RECIPIENT_NOT_FOUND' });
    await expect(service.fund('user-a', '-1')).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
  });
});
