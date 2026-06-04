export const RUTA_ESTADOS = ['planificada', 'en_curso', 'cerrada'] as const;

export type RutaEstado = (typeof RUTA_ESTADOS)[number];
