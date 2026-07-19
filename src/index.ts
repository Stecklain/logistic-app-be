import 'reflect-metadata';
import 'dotenv/config';
import cron from 'node-cron';
import { createApp } from './app';
import { initializeDataSource } from './repositories/data-source';
import { createBackup } from './services/backup.service';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;
const app = createApp();

function scheduleBackups() {
  if (process.env.BACKUP_ENABLED === 'false') {
    console.log('Backup automático deshabilitado (BACKUP_ENABLED=false)');
    return;
  }

  cron.schedule('0 */12 * * *', () => {
    createBackup()
      .then((filePath) => console.log(`Backup automático creado: ${filePath}`))
      .catch((error: Error) =>
        logger.error({ message: 'Error en backup automático', stack: error.stack })
      );
  });
  console.log('Backup automático programado cada 12 horas');
}

initializeDataSource()
  .then(() => {
    console.log('Base de datos conectada');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
    scheduleBackups();
  })
  .catch((err) => {
    console.error('Error al conectar la base de datos:', err);
    process.exit(1);
  });
