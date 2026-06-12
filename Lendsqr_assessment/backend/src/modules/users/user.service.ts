import { randomUUID } from 'crypto';
import { db } from '../../config/knex.js';
import { adjutorClient, type AdjutorClient } from '../adjutor/adjutor.client.js';
import { walletRepository, type WalletRepository } from '../wallets/wallet.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import { userRepository, type UserRepository } from './user.repository.js';
import type { CreateUserInput, User } from './user.types.js';

export class UserService {
  constructor(
    private readonly users: UserRepository = userRepository,
    private readonly wallets: WalletRepository = walletRepository,
    private readonly adjutor: AdjutorClient = adjutorClient
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    if (await this.users.findByEmail(input.email)) throw new AppError(409, 'Email already exists', 'DUPLICATE_EMAIL');
    if (input.phone && (await this.users.findByPhone(input.phone))) throw new AppError(409, 'Phone already exists', 'DUPLICATE_PHONE');

    const identity = input.bvn ?? input.email;
    const karma = await this.adjutor.checkKarma(identity);
    if (karma.blacklisted) throw new AppError(403, 'User is blacklisted by Adjutor Karma', 'KARMA_BLACKLISTED');

    return db.transaction(async (trx) => {
      const user = await this.users.create(
        {
          id: randomUUID(),
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: input.phone ?? null,
          bvn: input.bvn ?? null
        },
        trx
      );
      await this.wallets.create({ id: randomUUID(), user_id: user.id, balance: 0, currency: 'NGN' }, trx);
      return user;
    });
  }

  async getById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    return user;
  }
}

export const userService = new UserService();
