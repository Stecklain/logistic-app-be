export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteStop extends Coordinate {
  pedidoId: string;
}

export interface RouteOptimizationResult {
  orderedStops: Array<{
    pedidoId: string;
    ordenVisita: number;
    distanciaMetros: number;
    duracionSegundos: number;
  }>;
  geometry: {
    type: 'LineString';
    coordinates: Array<[number, number]>;
  };
}
