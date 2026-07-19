import 'dotenv/config';
import { initializeDataSource, destroyDataSource } from '../repositories/data-source';
import { registerUser } from '../services/auth.service';

async function seed() {
  await initializeDataSource({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await registerUser('admin@logistic.com', 'password123', 'admin');
    console.log('Usuario admin creado: admin@logistic.com / password123');
  } catch {
    console.log('El usuario admin ya existe, omitiendo.');
  }

  try {
    await registerUser('operador@logistic.com', 'password123', 'logistica');
    console.log('Usuario logística creado: operador@logistic.com / password123');
  } catch {
    console.log('El usuario logística ya existe, omitiendo.');
  }
}

seed()
  .then(() => destroyDataSource())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
