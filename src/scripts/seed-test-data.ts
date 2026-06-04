import 'dotenv/config';
import { createPedido } from '../services/pedido.service';
import { initializeDataSource, destroyDataSource } from '../repositories/data-source';
import { registerUser } from '../services/auth.service';

async function seed() {
  await initializeDataSource({
    host: process.env.TEST_DB_HOST,
    port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
    database: process.env.TEST_DB_NAME,
    username: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
  });

  try {
    await registerUser('admin@logistic.local', 'password123');
  } catch {}

  await createPedido({
    direccionDestino: 'Av. Rivadavia 1234',
    localidad: 'Buenos Aires',
    fechaEntrega: '2026-06-04',
    lat: -34.6037,
    lng: -58.3816,
  });
  await createPedido({
    direccionDestino: 'Av. Corrientes 567',
    localidad: 'Buenos Aires',
    fechaEntrega: '2026-06-04',
    lat: -34.6044,
    lng: -58.3862,
  });
}

seed()
  .then(() => destroyDataSource())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
