# Backend Agent Guide

## Stack actual
- Node.js + Express 5 + TypeScript.
- PostgreSQL + TypeORM.
- Autenticación con JWT y hashing con bcrypt.
- Validaciones de entrada con Joi.

## Arquitectura obligatoria
- Mantener separación por capas: `routes -> controllers -> services -> persistence/entities`.
- Toda regla de negocio nueva debe vivir en `services`.
- Las rutas solo validan/auth y delegan.
- El boot de Express y el boot de base de datos deben quedar desacoplados para poder testear `app` sin levantar el servidor real.

## Testing obligatorio
- El estándar de testing del backend es `Mocha + Chai`.
- Las pruebas HTTP deben cubrir rutas y middleware usando una base PostgreSQL real de testing (`npm run test:db:up`, PostgreSQL nativo, sin Docker).
- Se trabaja con enfoque TDD estricto:
  1. escribir test;
  2. ver fallo;
  3. implementar mínimo necesario;
  4. refactorizar manteniendo verde.
- Cada ruta debe tener, como mínimo:
  - happy path;
  - validación inválida;
  - auth inválida cuando corresponda;
  - error de negocio;
  - verificación de persistencia/efecto final.

## Validación obligatoria antes de commit
- Correr la suite de tests del backend.
- Levantar el backend con el script correspondiente y verificar que arranca sin errores.
- Un cambio no se considera válido si no pasó tests y no arranca correctamente.
- La IA debe usar esta validación como criterio obligatorio antes de dar por terminado un desarrollo.

## Base de datos
- No usar `synchronize: true`.
- Todo cambio de esquema debe pasar por migraciones versionadas.
- La base de testing debe estar aislada de la base de desarrollo.

## Integraciones externas
- Para mapas/ruteo se usa `OpenRouteService`.
- Para tests, las integraciones externas deben poder ejecutarse en modo controlado/mockeado por configuración para que la suite sea determinista.
