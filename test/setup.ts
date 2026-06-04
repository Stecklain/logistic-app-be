import 'reflect-metadata'

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = '8h';
process.env.ORS_USE_MOCK = 'true';
process.env.TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.TEST_DB_PORT || '5433';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'logistic_db_test';
process.env.TEST_DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
