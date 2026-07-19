import { Raw } from 'typeorm';
import { esTransicionValida, PedidoEstado, PEDIDO_ESTADOS } from '../constants/pedido';
import { Pedido } from '../entities/Pedido';
import { getDataSource } from '../repositories/data-source';
import { geocodeAddress } from './routing.service';
import { generateTrackingCode } from '../utils/tracking';

interface PedidoPayload {
  direccionDestino: string;
  localidad: string;
  fechaEntrega: string;
  origenAlta?: 'manual' | 'api_externa';
  lat?: number | null;
  lng?: number | null;
  estado?: PedidoEstado;
}

interface ListPedidoFilters {
  page: number;
  pageSize: number;
  estado?: PedidoEstado;
  localidad?: string;
  codigoTracking?: string;
}

export async function listPedidos(filters: ListPedidoFilters) {
  const repo = getDataSource().getRepository(Pedido);
  const where: Record<string, unknown> = {};

  if (filters.estado) {
    where.estado = filters.estado;
  }
  if (filters.localidad) {
    where.localidad = Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:localidad)`, {
      localidad: `%${filters.localidad}%`,
    });
  }
  if (filters.codigoTracking) {
    where.codigoTracking = Raw(
      (alias) => `unaccent(${alias}) ILIKE unaccent(:codigoTracking)`,
      { codigoTracking: `%${filters.codigoTracking}%` }
    );
  }

  const [items, total] = await repo.findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 1,
  };
}

export async function getPedidoById(id: string) {
  return getDataSource().getRepository(Pedido).findOneBy({ id });
}

export async function createPedido(payload: PedidoPayload) {
  const repo = getDataSource().getRepository(Pedido);
  const coords =
    payload.lat != null && payload.lng != null
      ? { lat: payload.lat, lng: payload.lng }
      : await geocodeAddress(`${payload.direccionDestino}, ${payload.localidad}`);

  const pedido = repo.create({
    codigoTracking: await generateUniqueTrackingCode(),
    direccionDestino: payload.direccionDestino,
    localidad: payload.localidad,
    fechaEntrega: payload.fechaEntrega.slice(0, 10),
    origenAlta: payload.origenAlta || 'manual',
    estado: payload.estado || PEDIDO_ESTADOS[0],
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  });

  return repo.save(pedido);
}

export async function updatePedido(id: string, payload: Partial<PedidoPayload>) {
  const repo = getDataSource().getRepository(Pedido);
  const pedido = await repo.findOneBy({ id });
  if (!pedido) {
    return null;
  }

  if (pedido.estado === 'entregado') {
    throw new Error('No se puede editar un pedido entregado');
  }

  if (payload.direccionDestino) {
    pedido.direccionDestino = payload.direccionDestino;
  }
  if (payload.localidad) {
    pedido.localidad = payload.localidad;
  }
  if (payload.fechaEntrega) {
    pedido.fechaEntrega = payload.fechaEntrega.slice(0, 10);
  }
  if (payload.origenAlta) {
    pedido.origenAlta = payload.origenAlta;
  }
  if (payload.estado) {
    pedido.estado = payload.estado;
  }

  if (payload.lat !== undefined || payload.lng !== undefined) {
    pedido.lat = payload.lat ?? null;
    pedido.lng = payload.lng ?? null;
  } else if (payload.direccionDestino || payload.localidad) {
    const coords = await geocodeAddress(
      `${pedido.direccionDestino}, ${pedido.localidad}`
    );
    pedido.lat = coords?.lat ?? null;
    pedido.lng = coords?.lng ?? null;
  }

  return repo.save(pedido);
}

export async function updatePedidoEstado(id: string, estado: PedidoEstado) {
  const repo = getDataSource().getRepository(Pedido);
  const pedido = await repo.findOneBy({ id });
  if (!pedido) {
    return null;
  }

  if (!esTransicionValida(pedido.estado, estado)) {
    throw new Error(`No se puede pasar de "${pedido.estado}" a "${estado}"`);
  }

  pedido.estado = estado;
  return repo.save(pedido);
}

export async function deletePedido(id: string) {
  const result = await getDataSource().getRepository(Pedido).delete({ id });
  return !!result.affected;
}

interface ReportePeriodo {
  anio?: number;
  mes?: number;
}

export async function getPedidoReporte(periodo: ReportePeriodo = {}) {
  const repo = getDataSource().getRepository(Pedido);

  const porLocalidadYMesQuery = repo
    .createQueryBuilder('pedido')
    .select('pedido.localidad', 'localidad')
    .addSelect("to_char(pedido.createdAt, 'YYYY-MM')", 'mes')
    .addSelect('COUNT(*)', 'total')
    .groupBy('pedido.localidad')
    .addGroupBy('mes')
    .orderBy('mes', 'DESC')
    .addOrderBy('pedido.localidad', 'ASC')
    .limit(500);

  const porEstadoQuery = repo
    .createQueryBuilder('pedido')
    .select('pedido.estado', 'estado')
    .addSelect('COUNT(*)', 'total')
    .groupBy('pedido.estado');

  const porEstadoYMesQuery = repo
    .createQueryBuilder('pedido')
    .select('pedido.estado', 'estado')
    .addSelect("to_char(pedido.createdAt, 'YYYY-MM')", 'mes')
    .addSelect('COUNT(*)', 'total')
    .andWhere('pedido.estado IN (:...estados)', { estados: ['entregado', 'cancelado'] })
    .groupBy('pedido.estado')
    .addGroupBy('mes')
    .orderBy('mes', 'ASC')
    .limit(48);

  if (periodo.anio) {
    porLocalidadYMesQuery.andWhere('EXTRACT(YEAR FROM pedido.createdAt) = :anio', {
      anio: periodo.anio,
    });
    porEstadoQuery.andWhere('EXTRACT(YEAR FROM pedido.createdAt) = :anio', {
      anio: periodo.anio,
    });
    porEstadoYMesQuery.andWhere('EXTRACT(YEAR FROM pedido.createdAt) = :anio', {
      anio: periodo.anio,
    });
  }
  if (periodo.mes) {
    porLocalidadYMesQuery.andWhere('EXTRACT(MONTH FROM pedido.createdAt) = :mes', {
      mes: periodo.mes,
    });
    porEstadoQuery.andWhere('EXTRACT(MONTH FROM pedido.createdAt) = :mes', {
      mes: periodo.mes,
    });
    porEstadoYMesQuery.andWhere('EXTRACT(MONTH FROM pedido.createdAt) = :mes', {
      mes: periodo.mes,
    });
  }

  const [porLocalidadYMesRaw, porEstadoRaw, porEstadoYMesRaw] = await Promise.all([
    porLocalidadYMesQuery.getRawMany(),
    porEstadoQuery.getRawMany(),
    porEstadoYMesQuery.getRawMany(),
  ]);

  return {
    porLocalidadYMes: porLocalidadYMesRaw.map((row) => ({
      localidad: row.localidad as string,
      mes: row.mes as string,
      total: Number(row.total),
    })),
    porEstado: porEstadoRaw.map((row) => ({
      estado: row.estado as PedidoEstado,
      total: Number(row.total),
    })),
    porEstadoYMes: porEstadoYMesRaw.map((row) => ({
      estado: row.estado as PedidoEstado,
      mes: row.mes as string,
      total: Number(row.total),
    })),
  };
}

interface RangoFechas {
  desde?: string;
  hasta?: string;
}

export async function getPedidosPendientesPorFecha(rango: RangoFechas = {}) {
  const repo = getDataSource().getRepository(Pedido);

  const query = repo
    .createQueryBuilder('pedido')
    .select("to_char(pedido.fechaEntrega, 'YYYY-MM-DD')", 'fecha')
    .addSelect('COUNT(*)', 'total')
    .where('pedido.estado = :estado', { estado: 'pendiente' })
    .groupBy('pedido.fechaEntrega')
    .orderBy('pedido.fechaEntrega', 'ASC');

  if (rango.desde) {
    query.andWhere('pedido.fechaEntrega >= :desde', { desde: rango.desde });
  }
  if (rango.hasta) {
    query.andWhere('pedido.fechaEntrega <= :hasta', { hasta: rango.hasta });
  }

  const rows = await query.getRawMany();

  return rows.map((row) => ({
    fecha: row.fecha as string,
    total: Number(row.total),
  }));
}

async function generateUniqueTrackingCode() {
  const repo = getDataSource().getRepository(Pedido);
  let code = generateTrackingCode();

  while (await repo.existsBy({ codigoTracking: code })) {
    code = generateTrackingCode();
  }

  return code;
}
