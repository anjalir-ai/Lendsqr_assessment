import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.string('id', 36).primary();
    table.string('wallet_id', 36).notNullable();
    table.string('related_wallet_id', 36).nullable();
    table.string('transfer_group', 36).nullable().index();
    table.enu('type', ['FUND', 'TRANSFER_IN', 'TRANSFER_OUT', 'WITHDRAWAL']).notNullable();
    table.bigInteger('amount').notNullable();
    table.bigInteger('balance_before').notNullable();
    table.bigInteger('balance_after').notNullable();
    table.string('reference', 120).notNullable().unique();
    table.enu('status', ['SUCCESS', 'FAILED', 'PENDING']).notNullable().defaultTo('SUCCESS');
    table.string('description', 255).nullable();
    table.json('metadata').nullable();
    table.timestamps(true, true);
    table.foreign('wallet_id').references('wallets.id').onDelete('CASCADE');
    table.foreign('related_wallet_id').references('wallets.id').onDelete('SET NULL');
    table.index(['wallet_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
}
