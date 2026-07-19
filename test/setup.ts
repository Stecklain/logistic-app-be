import 'reflect-metadata'
import 'dotenv/config'
// Precarga: si un módulo .ts se `require()`a por primera vez desde un spec que no
// es el primero del glob, Mocha lo carga vía import() ESM y el require() interno
// no pasa por el hook de ts-node, rompiendo con "Cannot use import statement
// outside a module". Requerirlo acá (procesado por --require ts-node/register
// antes de que cargue cualquier spec) lo deja cacheado y evita el problema.
import '../src/services/backup.service'

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = '8h';
process.env.ORS_USE_MOCK = 'true';
process.env.TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'logistic_db_test';
process.env.TEST_DB_USER = process.env.TEST_DB_USER || 'logistic_app';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'logistic_app';
