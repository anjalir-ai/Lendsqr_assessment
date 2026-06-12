import type { Knex } from 'knex';
import { randomUUID } from 'crypto';

export async function seed(knex: Knex): Promise<void> {
  await knex('transactions').del();
  await knex('wallets').del();
  await knex('users').del();

  const alice = randomUUID();
  const bob = randomUUID();
  const aliceWallet = randomUUID();
  const bobWallet = randomUUID();

  await knex('users').insert([
    { id: alice, first_name: 'Ada', last_name: 'Demo', email: 'ada@example.com', phone: '08010000001' },
    { id: bob, first_name: 'Bola', last_name: 'Demo', email: 'bola@example.com', phone: '08010000002' }
  ]);
  await knex('wallets').insert([
    { id: aliceWallet, user_id: alice, balance: 100000, currency: 'NGN' },
    { id: bobWallet, user_id: bob, balance: 25000, currency: 'NGN' }
  ]);
}
