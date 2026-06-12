import type { Knex } from 'knex';
import { db } from '../../config/knex.js';
import type { User } from './user.types.js';

export class UserRepository {
  constructor(private readonly database: Knex = db) {}

  findById(id: string, trx?: Knex.Transaction): Promise<User | undefined> {
    return (trx ?? this.database)<User>('users').where({ id }).first();
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.database<User>('users').where({ email }).first();
  }

  findByPhone(phone: string): Promise<User | undefined> {
    return this.database<User>('users').where({ phone }).first();
  }

  async create(data: Omit<User, 'created_at' | 'updated_at'>, trx: Knex.Transaction): Promise<User> {
    await trx<User>('users').insert(data);
    const user = await trx<User>('users').where({ id: data.id }).first();
    if (!user) throw new Error('Failed to create user');
    return user;
  }
}

export const userRepository = new UserRepository();
