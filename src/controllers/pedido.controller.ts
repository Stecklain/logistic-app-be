import { Request, Response } from 'express';
import {
  createPedidoSchema,
  listPedidosSchema,
  pedidoReporteSchema,
  pedidosPendientesPorFechaSchema,
  updatePedidoEstadoSchema,
  updatePedidoSchema,
} from '../schemas/pedido.schema';
import {
  createPedido,
  deletePedido,
  getPedidoById,
  getPedidoReporte,
  getPedidosPendientesPorFecha,
  listPedidos,
  updatePedido,
  updatePedidoEstado,
} from '../services/pedido.service';
import { getSingleRouteParam } from '../utils/http';

export async function listPedidosHandler(req: Request, res: Response) {
  const { error, value } = listPedidosSchema.validate(req.query, {
    convert: true,
  });
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const result = await listPedidos(value);
  res.json(result);
}

export async function getPedidoReporteHandler(req: Request, res: Response) {
  const { error, value } = pedidoReporteSchema.validate(req.query, {
    convert: true,
  });
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const reporte = await getPedidoReporte(value);
  res.json(reporte);
}

export async function getPedidosPendientesPorFechaHandler(req: Request, res: Response) {
  const { error, value } = pedidosPendientesPorFechaSchema.validate(req.query);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const resumen = await getPedidosPendientesPorFecha(value);
  res.json(resumen);
}

export async function getPedidoByIdHandler(req: Request, res: Response) {
  const pedido = await getPedidoById(getSingleRouteParam(req.params.id));
  if (!pedido) {
    res.status(404).json({ message: 'Pedido no encontrado' });
    return;
  }

  res.json(pedido);
}

export async function createPedidoHandler(req: Request, res: Response) {
  const { error, value } = createPedidoSchema.validate(req.body, {
    convert: true,
  });
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const pedido = await createPedido(value);
  res.status(201).json(pedido);
}

export async function updatePedidoHandler(req: Request, res: Response) {
  const { error, value } = updatePedidoSchema.validate(req.body, {
    convert: true,
  });
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  try {
    const pedido = await updatePedido(getSingleRouteParam(req.params.id), value);
    if (!pedido) {
      res.status(404).json({ message: 'Pedido no encontrado' });
      return;
    }

    res.json(pedido);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(400).json({ message });
  }
}

export async function updatePedidoEstadoHandler(req: Request, res: Response) {
  const { error, value } = updatePedidoEstadoSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  try {
    const pedido = await updatePedidoEstado(
      getSingleRouteParam(req.params.id),
      value.estado
    );
    if (!pedido) {
      res.status(404).json({ message: 'Pedido no encontrado' });
      return;
    }

    res.json(pedido);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(400).json({ message });
  }
}

export async function deletePedidoHandler(req: Request, res: Response) {
  const deleted = await deletePedido(getSingleRouteParam(req.params.id));
  if (!deleted) {
    res.status(404).json({ message: 'Pedido no encontrado' });
    return;
  }

  res.status(204).send();
}
