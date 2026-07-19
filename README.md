# logistic-app-be

Backend de una plataforma de logística: login con roles, ABM de pedidos, agrupación automática de pedidos por zona y generación de ruta óptima por zona (OpenRouteService), tracking público, panel de administración de usuarios, reportes agregados y backup automático. Node.js + Express + TypeORM + PostgreSQL.

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior, corriendo como servicio local (no se usa Docker)
- Un rol de PostgreSQL con permiso `CREATEDB`
- `pg_dump`/`psql` en el `PATH` (vienen con la instalación de PostgreSQL) — necesarios para el backup automático

## 1. Crear el rol de base de datos

Conectate a Postgres con un superusuario (`psql -U postgres`) y corré una sola vez:

```sql
CREATE ROLE logistic_app WITH LOGIN PASSWORD 'logistic_app' CREATEDB;
```

Este proyecto usa un rol dedicado en vez del superusuario `postgres`, para no interferir con otras bases que pueda tener la máquina.

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Los valores por defecto de `.env.example` ya coinciden con el rol creado en el paso 1 (`logistic_app` / `logistic_app`, puerto 5432). Si tu instalación de Postgres usa otro puerto o credenciales, ajustalos ahí.

`ORS_USE_MOCK=true` hace que el servicio de ruteo use datos simulados en vez de llamar a la API real de OpenRouteService — no hace falta `ORS_API_KEY` para levantar el proyecto ni para probar el flujo de rutas. `BACKUP_ENABLED=false` desactiva el backup automático programado (ver más abajo) si no lo querés en una máquina de desarrollo.

## 3. Instalar dependencias

```bash
npm install
```

## 4. Crear la base de datos y correr migraciones

```bash
npm run dev:db:up   # crea la base "logistic_db" si no existe
npm run migrate      # corre las migraciones de TypeORM
```

## 5. Cargar usuarios de prueba

```bash
npx ts-node src/scripts/seed-dev-data.ts
```

Crea dos usuarios (si ya existen, no hace nada):

| Email | Password | Rol |
|---|---|---|
| `admin@logistic.com` | `password123` | `admin` |
| `operador@logistic.com` | `password123` | `logistica` |

## 6. (Opcional) Simular grandes volúmenes de datos

```bash
npm run seed:bulk
```

Inserta ~8000 pedidos ficticios con fechas repartidas en el último año, útil para probar paginación/filtros/el reporte agregado con volumen real. Configurable con `SEED_COUNT=<n>`.

## 7. Levantar el backend

```bash
npm run dev
```

Queda escuchando en `http://localhost:3000` (con recarga automática vía nodemon). Al arrancar programa un backup automático cada 12 horas (ver abajo) y crea `logs/error.log` para auditoría de errores.

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | — | Alta de usuario (rol `logistica` por defecto) |
| POST | `/api/auth/login` | — | Login, devuelve JWT. Bloquea la cuenta 10 minutos tras 3 intentos fallidos consecutivos. |
| GET | `/api/pedidos` | JWT | Listado paginado de pedidos, con filtros (`estado`, `localidad`, `codigoTracking`, insensibles a tildes) |
| GET | `/api/pedidos/reporte` | JWT | Agregados: pedidos por localidad/mes y por estado, filtrable por `anio`/`mes` |
| GET | `/api/pedidos/pendientes-por-fecha` | JWT | Cantidad de pedidos pendientes agrupados por `fechaEntrega`, filtrable por `desde`/`hasta` (usado por el frontend para mostrar qué días tienen pedidos sin recorrerlos uno por uno) |
| GET | `/api/pedidos/:id` | JWT | Detalle de un pedido |
| POST | `/api/pedidos` | JWT | Crear pedido |
| PUT | `/api/pedidos/:id` | JWT | Editar pedido (rechaza si el pedido ya está `entregado`) |
| PATCH | `/api/pedidos/:id/estado` | JWT | Cambiar estado del pedido, valida transiciones permitidas |
| DELETE | `/api/pedidos/:id` | JWT | Eliminar pedido |
| GET | `/api/rutas` | JWT | Listado de rutas generadas, filtrable por `fecha` |
| GET | `/api/rutas/:id` | JWT | Detalle de una ruta (con paradas) |
| POST | `/api/rutas/generar` | JWT | Agrupa los pedidos pendientes de la fecha por localidad/cercanía geográfica (`zonificacion.service.ts`, radio de 5km) y genera **una ruta óptima por zona**. Devuelve un array de rutas (una si todos los pedidos caen en la misma zona, varias si están dispersos) |
| GET | `/api/tracking/:codigoTracking` | — | Consulta pública de estado de un pedido |
| GET | `/api/users` | JWT + admin | Listado paginado de usuarios, con filtros (`email`, `role`, `active`) |
| POST | `/api/users` | JWT + admin | Crear usuario con rol específico |
| PUT | `/api/users/:id/email` | JWT + admin | Editar email de un usuario |
| PUT | `/api/users/:id/role-active` | JWT + admin | Cambiar rol y/o activar/desactivar un usuario |
| PUT | `/api/users/:id/password` | JWT + admin | Resetear la contraseña de un usuario |
| PUT | `/api/users/me/password` | JWT | Cualquier usuario autenticado cambia su propia contraseña |

`POST /api/pedidos` con `origenAlta: "api_externa"` está pensado para que sistemas externos den de alta pedidos automáticamente, pero hoy reutiliza el mismo JWT de administrador que usa el frontend — no tiene una API Key propia. Se evaluó agregar un esquema de autenticación diferenciado para integraciones externas y se decidió no implementarlo por el momento, dado que no era un requisito estricto para el alcance actual del proyecto.

## Manejo de errores y logging

Cualquier error no manejado explícitamente por un controller (incluyendo promesas rechazadas dentro de handlers `async`, gracias a Express 5) cae en un middleware centralizado que responde JSON consistente y registra el error en `logs/error.log` (JSON: timestamp, mensaje, stack, método, ruta, status). Las rutas inexistentes devuelven un 404 en JSON.

## Backup automático

- **Qué se respalda:** la base completa (`pg_dump -F p`, SQL plano).
- **Cada cuánto:** cada 12 horas mientras el servidor está corriendo (`node-cron`), o a demanda con `npm run backup`. Los archivos quedan en `backups/` (gitignored).
- **Cómo restaurar:** `npm run backup:restore -- backups/<archivo>.sql`. Para una recuperación real, restaurar contra una base nueva/vacía en vez de una con datos existentes.

## Resetear la base de desarrollo

```bash
npm run dev:db:down && npm run dev:db:up && npm run migrate && npx ts-node src/scripts/seed-dev-data.ts
```

## Testing

```bash
npm run test:db:up       # crea la base "logistic_db_test" si no existe
npm run test:db:migrate  # corre las migraciones sobre la base de test
npm test                 # Mocha + Supertest + Chai
```

Suite de 45 tests (`test/*.spec.ts`) contra una base PostgreSQL de test separada (`logistic_db_test`, mismo rol `logistic_app`), sin mocks de base de datos. Cubre autenticación (incluyendo bloqueo de cuenta tras intentos fallidos), CRUD y transiciones de estado de pedidos, agrupación por zona al generar rutas, administración de usuarios, tracking público, el endpoint de reporte, el middleware de errores, y el servicio de backup/restore.
