import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoginLockout1720400000003 implements MigrationInterface {
  name = 'AddLoginLockout1720400000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
    `);
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS locked_until;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS failed_login_attempts;`);
  }
}
