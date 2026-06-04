import 'reflect-metadata';
import 'dotenv/config';
import { createApp } from './app';
import { initializeDataSource } from './repositories/data-source';

const PORT = process.env.PORT || 3000;
const app = createApp();

initializeDataSource()
  .then(() => {
    console.log('Base de datos conectada');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('Error al conectar la base de datos:', err);
    process.exit(1);
  });
