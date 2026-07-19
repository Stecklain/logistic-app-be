import 'dotenv/config';
import { createBackup } from '../services/backup.service';

createBackup()
  .then((filePath) => {
    console.log(`Backup creado: ${filePath}`);
  })
  .catch((error) => {
    console.error('Error al crear el backup:', error);
    process.exit(1);
  });
