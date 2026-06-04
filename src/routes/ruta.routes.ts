import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import {
  generateRutaDelDiaHandler,
  getRutaByIdHandler,
  listRutasHandler,
} from '../controllers/ruta.controller';

const router = Router();

router.use(verifyToken);
router.get('/', listRutasHandler);
router.get('/:id', getRutaByIdHandler);
router.post('/generar', generateRutaDelDiaHandler);

export default router;
