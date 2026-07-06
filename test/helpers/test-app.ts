import { createApp } from '../../src/app';
import { Pedido } from '../../src/entities/Pedido';
import { Ruta } from '../../src/entities/Ruta';
import { RutaPedido } from '../../src/entities/RutaPedido';
import { User } from '../../src/entities/User';
import {
  destroyDataSource,
  getDataSource,
  initializeDataSource,
} from '../../src/repositories/data-source';

export async function setupTestApp() {
  await initializeDataSource({
    host: process.env.TEST_DB_HOST,
    port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
    database: process.env.TEST_DB_NAME,
    username: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
  });

  return createApp();
}

export async function resetDatabase() {
  const dataSource = getDataSource();
  await dataSource.query(
    'TRUNCATE TABLE ruta_pedidos, rutas, pedidos, users RESTART IDENTITY CASCADE;'
  );
}

export async function teardownTestApp() {
  await destroyDataSource();
}
