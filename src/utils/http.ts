export function getSingleRouteParam(value: string | string[] | undefined) {
  if (!value) {
    return '';
  }

  return Array.isArray(value) ? value[0] : value;
}
