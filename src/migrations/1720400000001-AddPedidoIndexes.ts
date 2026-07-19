import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPedidoIndexes1720400000001 implements MigrationInterface {
  name = 'AddPedidoIndexes1720400000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pedidos_localidad ON pedidos(localidad);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pedidos_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pedidos_localidad;`);
  }
}
