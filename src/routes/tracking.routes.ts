import { Router } from 'express';
import { getTrackingByCodeHandler } from '../controllers/tracking.controller';

const router = Router();

router.get('/:codigoTracking', getTrackingByCodeHandler);

export default router;
