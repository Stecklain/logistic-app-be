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
    await registerUser('admin@logistic.com', 'password123');
    console.log('Usuario de prueba creado: admin@logistic.com / password123');
  } catch {
    console.log('El usuario ya existe, omitiendo.');
  }
}

seed()
  .then(() => destroyDataSource())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
