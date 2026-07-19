import { Pedido } from '../entities/Pedido';

export interface ZonaPedidos {
  nombre: string;
  pedidos: Pedido[];
}

interface Centro {
  lat: number;
  lng: number;
}

const RADIO_FUSION_ZONAS_KM = 5;

/**
 * Agrupa pedidos por localidad (RF03) y fusiona zonas cuyos centroides
 * están a menos de RADIO_FUSION_ZONAS_KM entre sí, para cubrir también
 * la "cercanía geográfica" del requisito (localidades vecinas o con
 * variantes de escritura terminan en la misma zona de reparto).
 */
export function agruparPedidosPorZona(pedidos: Pedido[]): ZonaPedidos[] {
  const porLocalidad = new Map<string, Pedido[]>();

  for (const pedido of pedidos) {
    const clave = pedido.localidad.trim().toLowerCase();
    const grupo = porLocalidad.get(clave);
    if (grupo) {
      grupo.push(pedido);
    } else {
      porLocalidad.set(clave, [pedido]);
    }
  }

  const zonas = Array.from(porLocalidad.values())
    .map((grupo) => ({
      nombre: grupo[0].localidad,
      pedidos: grupo,
      centro: calcularCentroide(grupo),
    }))
    .sort((a, b) => b.pedidos.length - a.pedidos.length);

  const zonasFusionadas: Array<{ nombre: string; pedidos: Pedido[]; centro: Centro }> = [];

  for (const zona of zonas) {
    const zonaCercana = zonasFusionadas.find(
      (existente) => distanciaKm(existente.centro, zona.centro) <= RADIO_FUSION_ZONAS_KM
    );

    if (zonaCercana) {
      zonaCercana.pedidos.push(...zona.pedidos);
      zonaCercana.centro = calcularCentroide(zonaCercana.pedidos);
    } else {
      zonasFusionadas.push(zona);
    }
  }

  return zonasFusionadas.map(({ nombre, pedidos }) => ({ nombre, pedidos }));
}

function calcularCentroide(pedidos: Pedido[]): Centro {
  const lat = pedidos.reduce((suma, pedido) => suma + (pedido.lat ?? 0), 0) / pedidos.length;
  const lng = pedidos.reduce((suma, pedido) => suma + (pedido.lng ?? 0), 0) / pedidos.length;
  return { lat, lng };
}

function distanciaKm(a: Centro, b: Centro): number {
  const RADIO_TIERRA_KM = 6371;
  const dLat = aRadianes(b.lat - a.lat);
  const dLng = aRadianes(b.lng - a.lng);
  const senoLat = Math.sin(dLat / 2);
  const senoLng = Math.sin(dLng / 2);
  const h =
    senoLat * senoLat +
    Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * senoLng * senoLng;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}
