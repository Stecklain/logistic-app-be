import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRutaZona1720400000004 implements MigrationInterface {
  name = 'AddRutaZona1720400000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE rutas ADD COLUMN IF NOT EXISTS zona VARCHAR(120) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE rutas DROP COLUMN IF EXISTS zona;`);
  }
}
