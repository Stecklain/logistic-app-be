import 'dotenv/config';
import { randomUUID } from 'crypto';
import { initializeDataSource, destroyDataSource, getDataSource } from '../repositories/data-source';
import { Pedido } from '../entities/Pedido';
import { PEDIDO_ESTADOS } from '../constants/pedido';
import { generateTrackingCode } from '../utils/tracking';

const TOTAL = parseInt(process.env.SEED_COUNT || '8000', 10);
const BATCH_SIZE = 500;
const DIAS_HISTORIA = 365;

const LOCALIDADES = [
  'CABA',
  'La Plata',
  'Rosario',
  'Córdoba',
  'Mendoza',
  'Mar del Plata',
  'Bahía Blanca',
  'Salta',
  'Tucumán',
  'Neuquén',
];

const CALLES = [
  'Av. Corrientes',
  'Av. Rivadavia',
  'Calle 7',
  'Bv. Oroño',
  'Av. Colón',
  'San Martín',
  'Belgrano',
  'Mitre',
  'Sarmiento',
  'Av. 9 de Julio',
];

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDateWithinPastDays(days: number) {
  const now = Date.now();
  const offsetMs = Math.floor(Math.random() * days) * 24 * 60 * 60 * 1000;
  return new Date(now - offsetMs);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildPedido(usedCodes: Set<string>) {
  let codigoTracking = generateTrackingCode();
  while (usedCodes.has(codigoTracking)) {
    codigoTracking = generateTrackingCode();
  }
  usedCodes.add(codigoTracking);

  const createdAt = randomDateWithinPastDays(DIAS_HISTORIA);
  const fechaEntregaDate = new Date(createdAt);
  fechaEntregaDate.setDate(fechaEntregaDate.getDate() + 1 + Math.floor(Math.random() * 14));

  return {
    id: randomUUID(),
    codigoTracking,
    direccionDestino: `${randomItem(CALLES)} ${100 + Math.floor(Math.random() * 4000)}`,
    localidad: randomItem(LOCALIDADES),
    lat: null,
    lng: null,
    estado: randomItem(PEDIDO_ESTADOS),
    fechaEntrega: toDateOnly(fechaEntregaDate),
    origenAlta: 'manual' as const,
    createdAt,
  };
}

async function seed() {
  await initializeDataSource({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const repo = getDataSource().getRepository(Pedido);
  const usedCodes = new Set<string>();
  let inserted = 0;

  while (inserted < TOTAL) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL - inserted);
    const batch = Array.from({ length: batchSize }, () => buildPedido(usedCodes));

    await repo.createQueryBuilder().insert().into(Pedido).values(batch).execute();

    inserted += batchSize;
    console.log(`Insertados ${inserted}/${TOTAL} pedidos...`);
  }

  console.log(`Listo: ${inserted} pedidos ficticios insertados.`);
}

seed()
  .then(() => destroyDataSource())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
