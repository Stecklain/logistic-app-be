import 'dotenv/config';
import { restoreBackup } from '../services/backup.service';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Uso: npm run backup:restore -- <ruta-al-archivo.sql>');
  process.exit(1);
}

restoreBackup(filePath)
  .then(() => {
    console.log(`Restauración completa desde: ${filePath}`);
  })
  .catch((error) => {
    console.error('Error al restaurar el backup:', error);
    process.exit(1);
  });
