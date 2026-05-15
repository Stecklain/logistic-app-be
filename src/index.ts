import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { message: 'Demasiadas peticiones, intentá más tarde' },
  })
);

app.use('/api/auth', authRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

AppDataSource.initialize()
  .then(() => {
    console.log('Base de datos conectada');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('Error al conectar la base de datos:', err);
    process.exit(1);
  });
