import { Coordinate, RouteOptimizationResult, RouteStop } from '../models/route';

interface MatrixResponse {
  distances: number[][];
  durations: number[][];
}

export async function geocodeAddress(address: string): Promise<Coordinate | null> {
  if (useMockRouting()) {
    return mockGeocode(address);
  }

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    throw new Error('ORS_API_KEY no configurada');
  }

  const url = new URL(
    process.env.ORS_GEOCODE_URL ||
      'https://api.openrouteservice.org/geocode/search'
  );
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('text', address);
  url.searchParams.set('size', '1');
  url.searchParams.set('boundary.country', 'AR');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No fue posible geocodificar la dirección');
  }

  const data = (await response.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
  };
  const [lng, lat] = data.features?.[0]?.geometry?.coordinates || [];

  if (lat == null || lng == null) {
    return null;
  }

  return { lat, lng };
}

export async function calculateOptimalRoute(
  origin: Coordinate,
  stops: RouteStop[]
): Promise<RouteOptimizationResult> {
  if (useMockRouting()) {
    return mockRoute(origin, stops);
  }

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    throw new Error('ORS_API_KEY no configurada');
  }

  const matrix = await fetchMatrix(apiKey, origin, stops);
  const visitOrder = buildNearestNeighborOrder(matrix.durations, stops);
  const orderedStops = visitOrder.map((stop, index, array) => {
    const distance =
      index === 0
        ? matrix.distances[0][stop.matrixIndex]
        : matrix.distances[array[index - 1].matrixIndex][stop.matrixIndex];
    const duration =
      index === 0
        ? matrix.durations[0][stop.matrixIndex]
        : matrix.durations[array[index - 1].matrixIndex][stop.matrixIndex];

    return {
      pedidoId: stop.pedidoId,
      ordenVisita: index + 1,
      distanciaMetros: Math.round(distance ?? 0),
      duracionSegundos: Math.round(duration ?? 0),
    };
  });

  const geometry = await fetchDirectionsGeometry(apiKey, origin, visitOrder);

  return {
    orderedStops,
    geometry,
  };
}

function useMockRouting() {
  return process.env.ORS_USE_MOCK === 'true' || process.env.NODE_ENV === 'test';
}

function mockGeocode(address: string): Coordinate {
  let seed = 0;
  for (const char of address) {
    seed += char.charCodeAt(0);
  }

  return {
    lat: -34.6 + (seed % 25) / 100,
    lng: -58.45 + (seed % 25) / 100,
  };
}

function mockRoute(origin: Coordinate, stops: RouteStop[]): RouteOptimizationResult {
  const ordered = [...stops].sort((a, b) => a.lng - b.lng || a.lat - b.lat);
  const coordinates: Array<[number, number]> = [[origin.lng, origin.lat]];
  const orderedStops = ordered.map((stop, index) => {
    coordinates.push([stop.lng, stop.lat]);

    const previous = index === 0 ? origin : ordered[index - 1];
    const distance = Math.sqrt(
      Math.pow(stop.lat - previous.lat, 2) + Math.pow(stop.lng - previous.lng, 2)
    );
    const meters = Math.round(distance * 100000);

    return {
      pedidoId: stop.pedidoId,
      ordenVisita: index + 1,
      distanciaMetros: meters,
      duracionSegundos: Math.round(meters / 8),
    };
  });

  return {
    orderedStops,
    geometry: {
      type: 'LineString',
      coordinates: coordinates as Array<[number, number]>,
    },
  };
}

async function fetchMatrix(apiKey: string, origin: Coordinate, stops: RouteStop[]) {
  const locations = [
    [origin.lng, origin.lat],
    ...stops.map((stop) => [stop.lng, stop.lat]),
  ];

  const response = await fetch(
    process.env.ORS_MATRIX_URL ||
      'https://api.openrouteservice.org/v2/matrix/driving-car',
    {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations,
        metrics: ['distance', 'duration'],
      }),
    }
  );

  if (!response.ok) {
    throw new Error('No fue posible obtener la matriz de distancias');
  }

  return (await response.json()) as MatrixResponse;
}

function buildNearestNeighborOrder(durations: number[][], stops: RouteStop[]) {
  const unvisited = stops.map((stop, index) => ({
    ...stop,
    matrixIndex: index + 1,
  }));
  const ordered: Array<RouteStop & { matrixIndex: number }> = [];
  let currentIndex = 0;

  while (unvisited.length > 0) {
    let next = unvisited[0];
    for (const candidate of unvisited) {
      if (
        (durations[currentIndex]?.[candidate.matrixIndex] ?? Number.MAX_SAFE_INTEGER) <
        (durations[currentIndex]?.[next.matrixIndex] ?? Number.MAX_SAFE_INTEGER)
      ) {
        next = candidate;
      }
    }

    ordered.push(next);
    currentIndex = next.matrixIndex;
    const idx = unvisited.findIndex((stop) => stop.pedidoId === next.pedidoId);
    unvisited.splice(idx, 1);
  }

  return ordered;
}

async function fetchDirectionsGeometry(
  apiKey: string,
  origin: Coordinate,
  orderedStops: Array<RouteStop & { matrixIndex: number }>
) {
  const coordinates = [
    [origin.lng, origin.lat] as [number, number],
    ...orderedStops.map((stop) => [stop.lng, stop.lat] as [number, number]),
  ];

  const response = await fetch(
    process.env.ORS_DIRECTIONS_URL ||
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates }),
    }
  );

  if (!response.ok) {
    throw new Error('No fue posible obtener el trazado de la ruta');
  }

  const data = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: Array<[number, number]> };
    }>;
  };

  const geometry = data.features?.[0]?.geometry;
  if (!geometry?.coordinates?.length) {
    return {
      type: 'LineString' as const,
      coordinates: coordinates as Array<[number, number]>,
    };
  }

  return {
    type: 'LineString' as const,
    coordinates: geometry.coordinates,
  };
}
