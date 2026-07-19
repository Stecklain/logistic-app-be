import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableUnaccent1720400000002 implements MigrationInterface {
  name = 'EnableUnaccent1720400000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent;`);
  }
}
