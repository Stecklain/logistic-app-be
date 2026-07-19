import { Pedido } from '../entities/Pedido';
import { Ruta } from '../entities/Ruta';
import { RutaPedido } from '../entities/RutaPedido';
import { getDataSource } from '../repositories/data-source';
import {
  calculateOptimalRoute,
  geocodeAddress,
} from './routing.service';
import { agruparPedidosPorZona } from './zonificacion.service';

interface GenerateRutaPayload {
  fecha: string;
  origenTexto: string;
  origenLat?: number;
  origenLng?: number;
}

export async function listRutas(fecha?: string) {
  return getDataSource().getRepository(Ruta).find({
    where: fecha ? { fecha: fecha.slice(0, 10) } : {},
    relations: {
      rutaPedidos: {
        pedido: true,
      },
    },
    order: {
      fecha: 'DESC',
      createdAt: 'DESC',
      rutaPedidos: {
        ordenVisita: 'ASC',
      },
    },
  });
}

export async function getRutaById(id: string) {
  return getDataSource().getRepository(Ruta).findOne({
    where: { id },
    relations: {
      rutaPedidos: {
        pedido: true,
      },
    },
    order: {
      rutaPedidos: {
        ordenVisita: 'ASC',
      },
    },
  });
}

export async function generateRutaDelDia(payload: GenerateRutaPayload) {
  const dataSource = getDataSource();
  const pedidoRepo = dataSource.getRepository(Pedido);
  const rutaRepo = dataSource.getRepository(Ruta);
  const rutaPedidoRepo = dataSource.getRepository(RutaPedido);
  const fecha = payload.fecha.slice(0, 10);

  const pedidos = await pedidoRepo.find({
    where: {
      fechaEntrega: fecha,
      estado: 'pendiente',
    },
    order: { createdAt: 'ASC' },
  });

  const pedidosValidos = pedidos.filter(
    (pedido) => pedido.lat != null && pedido.lng != null
  );

  if (pedidosValidos.length === 0) {
    throw new Error('No hay pedidos pendientes con coordenadas válidas para esa fecha');
  }

  const origin =
    payload.origenLat != null && payload.origenLng != null
      ? { lat: payload.origenLat, lng: payload.origenLng }
      : await geocodeAddress(payload.origenTexto);

  if (!origin) {
    throw new Error('No fue posible geocodificar el origen');
  }

  await dataSource.transaction(async (manager) => {
    const existing = await manager.getRepository(Ruta).find({
      where: { fecha, estado: 'planificada' },
    });

    if (existing.length > 0) {
      await manager.getRepository(Ruta).remove(existing);
    }
  });

  const zonas = agruparPedidosPorZona(pedidosValidos);
  const rutasGeneradas: Ruta[] = [];

  for (const zona of zonas) {
    const optimization = await calculateOptimalRoute(
      origin,
      zona.pedidos.map((pedido) => ({
        pedidoId: pedido.id,
        lat: pedido.lat!,
        lng: pedido.lng!,
      }))
    );

    const ruta = rutaRepo.create({
      fecha,
      estado: 'planificada',
      zona: zona.nombre,
      origenTexto: payload.origenTexto,
      origenLat: origin.lat,
      origenLng: origin.lng,
      routeGeometryJson: JSON.stringify(optimization.geometry),
    });

    const savedRuta = await rutaRepo.save(ruta);

    await rutaPedidoRepo.save(
      optimization.orderedStops.map((stop) =>
        rutaPedidoRepo.create({
          rutaId: savedRuta.id,
          pedidoId: stop.pedidoId,
          ordenVisita: stop.ordenVisita,
          distanciaMetros: stop.distanciaMetros,
          duracionSegundos: stop.duracionSegundos,
        })
      )
    );

    rutasGeneradas.push(savedRuta);
  }

  const rutasCompletas = await Promise.all(
    rutasGeneradas.map((ruta) => getRutaById(ruta.id))
  );

  return rutasCompletas as Ruta[];
}
