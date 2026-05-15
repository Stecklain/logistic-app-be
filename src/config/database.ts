import { DataSource } from 'typeorm';
import { User } from '../entities/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'logistic_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  synchronize: true, // En producción usar migraciones
  logging: false,
  entities: [User],
});
