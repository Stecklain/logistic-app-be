import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

export function errorHandler(
  err: Error & { status?: number; statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || err.statusCode || 500;

  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
    status,
  });

  const responseMessage = status < 500 ? err.message : 'Ocurrió un error inesperado';
  res.status(status).json({ message: responseMessage });
}
