export const PEDIDO_ESTADOS = [
  'pendiente',
  'en_ruta',
  'entregado',
  'cancelado',
] as const;

export type PedidoEstado = (typeof PEDIDO_ESTADOS)[number];

export const ORIGENES_ALTA = ['manual', 'api_externa'] as const;

export type OrigenAlta = (typeof ORIGENES_ALTA)[number];
