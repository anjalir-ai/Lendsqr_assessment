import { app } from './app.js';
import { db } from './config/knex.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`Demo Credit API listening on port ${env.PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await db.destroy();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
