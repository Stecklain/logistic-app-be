import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1717520000000 implements MigrationInterface {
  name = 'InitialSchema1717520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id VARCHAR(36) PRIMARY KEY,
        codigo_tracking VARCHAR(32) NOT NULL UNIQUE,
        direccion_destino VARCHAR(255) NOT NULL,
        localidad VARCHAR(120) NOT NULL,
        lat DOUBLE PRECISION NULL,
        lng DOUBLE PRECISION NULL,
        estado VARCHAR(20) NOT NULL,
        fecha_entrega DATE NOT NULL,
        origen_alta VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rutas (
        id VARCHAR(36) PRIMARY KEY,
        fecha DATE NOT NULL,
        estado VARCHAR(20) NOT NULL,
        origen_texto VARCHAR(255) NOT NULL,
        origen_lat DOUBLE PRECISION NOT NULL,
        origen_lng DOUBLE PRECISION NOT NULL,
        route_geometry_json TEXT NULL,
        created_by_id VARCHAR(36) NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ruta_pedidos (
        id VARCHAR(36) PRIMARY KEY,
        ruta_id VARCHAR(36) NOT NULL REFERENCES rutas(id) ON DELETE CASCADE,
        pedido_id VARCHAR(36) NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        orden_visita INTEGER NOT NULL,
        distancia_metros INTEGER NOT NULL DEFAULT 0,
        duracion_segundos INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT uq_ruta_pedidos_ruta_pedido UNIQUE (ruta_id, pedido_id),
        CONSTRAINT uq_ruta_pedidos_ruta_orden UNIQUE (ruta_id, orden_visita)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pedidos_tracking ON pedidos(codigo_tracking);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_estado ON pedidos(fecha_entrega, estado);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rutas_fecha ON rutas(fecha);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ruta_pedidos;`);
    await queryRunner.query(`DROP TABLE IF EXISTS rutas;`);
    await queryRunner.query(`DROP TABLE IF EXISTS pedidos;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
