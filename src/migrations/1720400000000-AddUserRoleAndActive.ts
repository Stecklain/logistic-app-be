import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleAndActive1720400000000 implements MigrationInterface {
  name = 'AddUserRoleAndActive1720400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'logistica';
    `);
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS active;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS role;`);
  }
}
