import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const backupsDir = path.join(process.cwd(), 'backups');

interface ConnectionConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

function resolveConnection(overrides: Partial<ConnectionConfig> = {}): ConnectionConfig {
  return {
    host: overrides.host || process.env.DB_HOST || 'localhost',
    port: overrides.port || process.env.DB_PORT || '5432',
    user: overrides.user || process.env.DB_USER || 'postgres',
    password: overrides.password ?? process.env.DB_PASSWORD ?? '',
    database: overrides.database || process.env.DB_NAME || 'logistic_db',
  };
}

export async function createBackup(overrides: Partial<ConnectionConfig> = {}): Promise<string> {
  const conn = resolveConnection(overrides);
  fs.mkdirSync(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(backupsDir, `${conn.database}-${timestamp}.sql`);

  await execFileAsync(
    'pg_dump',
    ['-h', conn.host, '-p', conn.port, '-U', conn.user, '-F', 'p', '-f', filePath, conn.database],
    { env: { ...process.env, PGPASSWORD: conn.password } }
  );

  return filePath;
}

export async function restoreBackup(
  filePath: string,
  overrides: Partial<ConnectionConfig> = {}
): Promise<void> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el archivo de backup: ${filePath}`);
  }

  const conn = resolveConnection(overrides);

  await execFileAsync(
    'psql',
    ['-h', conn.host, '-p', conn.port, '-U', conn.user, '-d', conn.database, '-f', filePath],
    { env: { ...process.env, PGPASSWORD: conn.password } }
  );
}
