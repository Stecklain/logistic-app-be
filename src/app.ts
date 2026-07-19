import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import pedidoRoutes from './routes/pedido.routes';
import rutaRoutes from './routes/ruta.routes';
import trackingRoutes from './routes/tracking.routes';
import userRoutes from './routes/user.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();
  const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    ...configuredOrigins,
  ]));

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      },
    })
  );
  app.use(express.json());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: process.env.NODE_ENV === 'test' ? 1000 : 60,
      message: { message: 'Demasiadas peticiones, intenta más tarde' },
    })
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/pedidos', pedidoRoutes);
  app.use('/api/rutas', rutaRoutes);
  app.use('/api/tracking', trackingRoutes);
  app.use('/api/users', userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
