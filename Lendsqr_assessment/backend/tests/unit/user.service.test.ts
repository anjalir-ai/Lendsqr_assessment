import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/shared/errors/AppError.js';
import type { AdjutorClient } from '../../src/modules/adjutor/adjutor.client.js';
import { UserService } from '../../src/modules/users/user.service.js';
import type { UserRepository } from '../../src/modules/users/user.repository.js';
import type { WalletRepository } from '../../src/modules/wallets/wallet.repository.js';
import type { User } from '../../src/modules/users/user.types.js';

vi.mock('../../src/config/knex.js', () => ({
  db: { transaction: async <T>(callback: (trx: object) => Promise<T>) => callback({}) }
}));

const user: User = {
  id: 'user-1',
  first_name: 'Ada',
  last_name: 'Demo',
  email: 'ada@example.com',
  phone: null,
  bvn: null,
  created_at: new Date(),
  updated_at: new Date()
};

describe('UserService', () => {
  let createdUsers: User[];
  let createdWallets: string[];
  let users: UserRepository;
  let wallets: WalletRepository;
  let adjutor: AdjutorClient;

  beforeEach(() => {
    createdUsers = [];
    createdWallets = [];
    users = {
      findByEmail: vi.fn(async () => undefined),
      findByPhone: vi.fn(async () => undefined),
      findById: vi.fn(async () => user),
      create: vi.fn(async (data: User) => {
        const saved = { ...user, ...data };
        createdUsers.push(saved);
        return saved;
      })
    } as unknown as UserRepository;
    wallets = {
      create: vi.fn(async (data: { user_id: string }) => {
        createdWallets.push(data.user_id);
        return { id: 'wallet-1', user_id: data.user_id, balance: 0, currency: 'NGN', created_at: new Date(), updated_at: new Date() };
      })
    } as unknown as WalletRepository;
    adjutor = { checkKarma: vi.fn(async () => ({ blacklisted: false })) } as unknown as AdjutorClient;
  });

  it('creates user and wallet when Adjutor returns clear', async () => {
    const service = new UserService(users, wallets, adjutor);
    const result = await service.create({ firstName: 'Ada', lastName: 'Demo', email: 'ada@example.com' });

    expect(result.email).toBe('ada@example.com');
    expect(createdUsers).toHaveLength(1);
    expect(createdWallets).toHaveLength(1);
  });

  it('rejects duplicate email before Adjutor and database writes', async () => {
    users.findByEmail = vi.fn(async () => user);
    const service = new UserService(users, wallets, adjutor);

    await expect(service.create({ firstName: 'Ada', lastName: 'Demo', email: 'ada@example.com' })).rejects.toMatchObject({ code: 'DUPLICATE_EMAIL' });
    expect(createdUsers).toHaveLength(0);
  });

  it('rejects blacklisted users without creating records', async () => {
    adjutor.checkKarma = vi.fn(async () => ({ blacklisted: true, reason: 'karma' }));
    const service = new UserService(users, wallets, adjutor);

    await expect(service.create({ firstName: 'Ada', lastName: 'Demo', email: 'ada@example.com' })).rejects.toMatchObject({ code: 'KARMA_BLACKLISTED' });
    expect(createdUsers).toHaveLength(0);
    expect(createdWallets).toHaveLength(0);
  });

  it('does not create records when Adjutor fails', async () => {
    adjutor.checkKarma = vi.fn(async () => {
      throw new AppError(503, 'Adjutor unavailable', 'ADJUTOR_UNAVAILABLE');
    });
    const service = new UserService(users, wallets, adjutor);

    await expect(service.create({ firstName: 'Ada', lastName: 'Demo', email: 'ada@example.com' })).rejects.toMatchObject({ code: 'ADJUTOR_UNAVAILABLE' });
    expect(createdUsers).toHaveLength(0);
  });
});
