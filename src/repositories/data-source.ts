import { DataSource } from 'typeorm';
import { Pedido } from '../entities/Pedido';
import { Ruta } from '../entities/Ruta';
import { RutaPedido } from '../entities/RutaPedido';
import { User } from '../entities/User';
import { InitialSchema1717520000000 } from '../migrations/1717520000000-InitialSchema';
import { AddUserRoleAndActive1720400000000 } from '../migrations/1720400000000-AddUserRoleAndActive';
import { AddPedidoIndexes1720400000001 } from '../migrations/1720400000001-AddPedidoIndexes';
import { EnableUnaccent1720400000002 } from '../migrations/1720400000002-EnableUnaccent';
import { AddLoginLockout1720400000003 } from '../migrations/1720400000003-AddLoginLockout';
import { AddRutaZona1720400000004 } from '../migrations/1720400000004-AddRutaZona';

type DataSourceOverrides = Partial<{
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  logging: boolean;
  synchronize: boolean;
}>;

let activeDataSource: DataSource | null = null;

function defaultConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'logistic_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };
}

export function buildDataSource(options: DataSourceOverrides = {}) {
  const config = defaultConfig();

  return new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password,
    logging: false,
    synchronize: false,
    entities: [User, Pedido, Ruta, RutaPedido],
    migrations: [
      InitialSchema1717520000000,
      AddUserRoleAndActive1720400000000,
      AddPedidoIndexes1720400000001,
      EnableUnaccent1720400000002,
      AddLoginLockout1720400000003,
      AddRutaZona1720400000004,
    ],
    ...options,
  });
}

export async function initializeDataSource(
  options: DataSourceOverrides = {}
) {
  if (activeDataSource?.isInitialized) {
    return activeDataSource;
  }

  activeDataSource = buildDataSource(options);
  await activeDataSource.initialize();
  await activeDataSource.runMigrations();
  return activeDataSource;
}

export function getDataSource() {
  if (!activeDataSource?.isInitialized) {
    throw new Error('La base de datos no está inicializada');
  }

  return activeDataSource;
}

export async function destroyDataSource() {
  if (activeDataSource?.isInitialized) {
    await activeDataSource.destroy();
  }

  activeDataSource = null;
}
