import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('first_name', 80).notNullable();
    table.string('last_name', 80).notNullable();
    table.string('email', 160).notNullable().unique();
    table.string('phone', 30).nullable().unique();
    table.string('bvn', 20).nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
