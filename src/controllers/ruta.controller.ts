import { Request, Response } from 'express';
import {
  generateRutaSchema,
  listRutasSchema,
} from '../schemas/ruta.schema';
import {
  generateRutaDelDia,
  getRutaById,
  listRutas,
} from '../services/ruta.service';
import { getSingleRouteParam } from '../utils/http';

export async function listRutasHandler(req: Request, res: Response) {
  const { error, value } = listRutasSchema.validate(req.query);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const rutas = await listRutas(value.fecha);
  res.json(rutas);
}

export async function getRutaByIdHandler(req: Request, res: Response) {
  const ruta = await getRutaById(getSingleRouteParam(req.params.id));
  if (!ruta) {
    res.status(404).json({ message: 'Ruta no encontrada' });
    return;
  }

  res.json(ruta);
}

export async function generateRutaDelDiaHandler(req: Request, res: Response) {
  const { error, value } = generateRutaSchema.validate(req.body, {
    convert: true,
  });
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  try {
    const rutas = await generateRutaDelDia(value);
    res.status(201).json(rutas);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No fue posible generar la ruta';
    res.status(400).json({ message });
  }
}
