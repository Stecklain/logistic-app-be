import { Pedido } from '../entities/Pedido';
import { getDataSource } from '../repositories/data-source';

export async function getTrackingByCode(codigoTracking: string) {
  const pedido = await getDataSource().getRepository(Pedido).findOneBy({
    codigoTracking,
  });

  if (!pedido) {
    return null;
  }

  return {
    codigoTracking: pedido.codigoTracking,
    estado: pedido.estado,
    fechaEntrega: pedido.fechaEntrega,
  };
}
