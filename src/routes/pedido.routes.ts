import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import {
  createPedidoHandler,
  deletePedidoHandler,
  getPedidoByIdHandler,
  listPedidosHandler,
  updatePedidoEstadoHandler,
  updatePedidoHandler,
} from '../controllers/pedido.controller';

const router = Router();

router.use(verifyToken);
router.get('/', listPedidosHandler);
router.get('/:id', getPedidoByIdHandler);
router.post('/', createPedidoHandler);
router.put('/:id', updatePedidoHandler);
router.patch('/:id/estado', updatePedidoEstadoHandler);
router.delete('/:id', deletePedidoHandler);

export default router;
