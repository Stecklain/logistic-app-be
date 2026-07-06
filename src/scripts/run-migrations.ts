import 'dotenv/config';
import { buildDataSource } from '../repositories/data-source';

async function run() {
  const isTest = process.argv.includes('--env') &&
    process.argv[process.argv.indexOf('--env') + 1] === 'test';

  const dataSource = buildDataSource({
    host: process.env[isTest ? 'TEST_DB_HOST' : 'DB_HOST'] || 'localhost',
    port: parseInt(
      process.env[isTest ? 'TEST_DB_PORT' : 'DB_PORT'] || '5432',
      10
    ),
    database:
      process.env[isTest ? 'TEST_DB_NAME' : 'DB_NAME'] ||
      (isTest ? 'logistic_db_test' : 'logistic_db'),
    username:
      process.env[isTest ? 'TEST_DB_USER' : 'DB_USER'] || 'logistic_app',
    password:
      process.env[isTest ? 'TEST_DB_PASSWORD' : 'DB_PASSWORD'] || 'logistic_app',
  });

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
