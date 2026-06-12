import { randomUUID } from 'crypto';
import { db } from '../../config/knex.js';
import { AppError } from '../../shared/errors/AppError.js';
import { toMinorUnits } from '../../shared/utils/money.js';
import { transactionRepository, type TransactionRepository } from '../transactions/transaction.repository.js';
import { userRepository, type UserRepository } from '../users/user.repository.js';
import { walletRepository, type WalletRepository } from './wallet.repository.js';
import type { Wallet } from './wallet.types.js';

export class WalletService {
  constructor(
    private readonly wallets: WalletRepository = walletRepository,
    private readonly transactions: TransactionRepository = transactionRepository,
    private readonly users: UserRepository = userRepository
  ) {}

  async getByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.wallets.findByUserId(userId);
    if (!wallet) throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    return wallet;
  }

  async fund(userId: string, rawAmount: unknown, reference = `fund_${randomUUID()}`): Promise<Wallet> {
    const amount = toMinorUnits(rawAmount);
    return db.transaction(async (trx) => {
      const wallet = await this.wallets.findByUserIdForUpdate(userId, trx);
      if (!wallet) throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
      const nextBalance = wallet.balance + amount;
      await this.wallets.updateBalance(wallet.id, nextBalance, trx);
      await this.transactions.create(
        {
          id: randomUUID(),
          wallet_id: wallet.id,
          related_wallet_id: null,
          transfer_group: null,
          type: 'FUND',
          amount,
          balance_before: wallet.balance,
          balance_after: nextBalance,
          reference,
          status: 'SUCCESS',
          description: 'Wallet funding',
          metadata: null
        },
        trx
      );
      return { ...wallet, balance: nextBalance };
    });
  }

  async withdraw(userId: string, rawAmount: unknown, reference = `withdraw_${randomUUID()}`): Promise<Wallet> {
    const amount = toMinorUnits(rawAmount);
    return db.transaction(async (trx) => {
      const wallet = await this.wallets.findByUserIdForUpdate(userId, trx);
      if (!wallet) throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
      if (wallet.balance < amount) throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
      const nextBalance = wallet.balance - amount;
      await this.wallets.updateBalance(wallet.id, nextBalance, trx);
      await this.transactions.create(
        {
          id: randomUUID(),
          wallet_id: wallet.id,
          related_wallet_id: null,
          transfer_group: null,
          type: 'WITHDRAWAL',
          amount,
          balance_before: wallet.balance,
          balance_after: nextBalance,
          reference,
          status: 'SUCCESS',
          description: 'Wallet withdrawal',
          metadata: null
        },
        trx
      );
      return { ...wallet, balance: nextBalance };
    });
  }

  async transfer(senderUserId: string, recipientUserId: string, rawAmount: unknown, reference = `transfer_${randomUUID()}`, description?: string): Promise<Wallet> {
    if (senderUserId === recipientUserId) throw new AppError(400, 'Cannot transfer to self', 'SELF_TRANSFER');
    const amount = toMinorUnits(rawAmount);
    const recipient = await this.users.findById(recipientUserId);
    if (!recipient) throw new AppError(404, 'Recipient user not found', 'RECIPIENT_NOT_FOUND');

    return db.transaction(async (trx) => {
      const senderWallet = await this.wallets.findByUserIdForUpdate(senderUserId, trx);
      const recipientWallet = await this.wallets.findByUserIdForUpdate(recipientUserId, trx);
      if (!senderWallet) throw new AppError(404, 'Sender wallet not found', 'WALLET_NOT_FOUND');
      if (!recipientWallet) throw new AppError(404, 'Recipient wallet not found', 'RECIPIENT_WALLET_NOT_FOUND');
      if (senderWallet.balance < amount) throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');

      const senderNext = senderWallet.balance - amount;
      const recipientNext = recipientWallet.balance + amount;
      const group = randomUUID();
      await this.wallets.updateBalance(senderWallet.id, senderNext, trx);
      await this.wallets.updateBalance(recipientWallet.id, recipientNext, trx);
      await this.transactions.create(
        {
          id: randomUUID(),
          wallet_id: senderWallet.id,
          related_wallet_id: recipientWallet.id,
          transfer_group: group,
          type: 'TRANSFER_OUT',
          amount,
          balance_before: senderWallet.balance,
          balance_after: senderNext,
          reference: `${reference}_out`,
          status: 'SUCCESS',
          description: description ?? 'Wallet transfer',
          metadata: { recipientUserId }
        },
        trx
      );
      await this.transactions.create(
        {
          id: randomUUID(),
          wallet_id: recipientWallet.id,
          related_wallet_id: senderWallet.id,
          transfer_group: group,
          type: 'TRANSFER_IN',
          amount,
          balance_before: recipientWallet.balance,
          balance_after: recipientNext,
          reference: `${reference}_in`,
          status: 'SUCCESS',
          description: description ?? 'Wallet transfer',
          metadata: { senderUserId }
        },
        trx
      );
      return { ...senderWallet, balance: senderNext };
    });
  }
}

export const walletService = new WalletService();
