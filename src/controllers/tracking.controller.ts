import { Request, Response } from 'express';
import { getTrackingByCode } from '../services/tracking.service';
import { getSingleRouteParam } from '../utils/http';

export async function getTrackingByCodeHandler(req: Request, res: Response) {
  const tracking = await getTrackingByCode(
    getSingleRouteParam(req.params.codigoTracking)
  );
  if (!tracking) {
    res.status(404).json({ message: 'Pedido no encontrado' });
    return;
  }

  res.json(tracking);
}
