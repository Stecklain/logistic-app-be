import { ILike } from 'typeorm';
import { PedidoEstado, PEDIDO_ESTADOS } from '../constants/pedido';
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
    where.localidad = ILike(`%${filters.localidad}%`);
  }
  if (filters.codigoTracking) {
    where.codigoTracking = ILike(`%${filters.codigoTracking}%`);
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

  pedido.estado = estado;
  return repo.save(pedido);
}

export async function deletePedido(id: string) {
  const result = await getDataSource().getRepository(Pedido).delete({ id });
  return !!result.affected;
}

async function generateUniqueTrackingCode() {
  const repo = getDataSource().getRepository(Pedido);
  let code = generateTrackingCode();

  while (await repo.existsBy({ codigoTracking: code })) {
    code = generateTrackingCode();
  }

  return code;
}
