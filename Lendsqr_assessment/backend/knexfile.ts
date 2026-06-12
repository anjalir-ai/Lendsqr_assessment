import type { Knex } from 'knex';
import { config as loadDotenv } from 'dotenv';

loadDotenv();

const databaseUrl = process.env.DATABASE_URL ?? 'mysql://demo_credit:demo_credit@localhost:3306/demo_credit';

const config: Record<string, Knex.Config> = {
  development: {
    client: 'mysql2',
    connection: databaseUrl,
    migrations: { directory: './src/database/migrations', extension: 'ts' },
    seeds: { directory: './src/database/seeds', extension: 'ts' }
  },
  production: {
    client: 'mysql2',
    connection: databaseUrl,
    pool: { min: 2, max: 10 },
    migrations: { directory: './src/database/migrations', extension: 'ts' },
    seeds: { directory: './src/database/seeds', extension: 'ts' }
  },
  test: {
    client: 'mysql2',
    connection: process.env.TEST_DATABASE_URL ?? databaseUrl,
    migrations: { directory: './src/database/migrations', extension: 'ts' },
    seeds: { directory: './src/database/seeds', extension: 'ts' }
  }
};

export default config[process.env.NODE_ENV ?? 'development'];
