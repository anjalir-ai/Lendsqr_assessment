import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wallets', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().unique();
    table.bigInteger('balance').notNullable().defaultTo(0);
    table.string('currency', 3).notNullable().defaultTo('NGN');
    table.timestamps(true, true);
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wallets');
}
