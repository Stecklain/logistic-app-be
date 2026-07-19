import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/requireAdmin';
import {
  adminSetPasswordHandler,
  changeOwnPasswordHandler,
  createUserHandler,
  listUsersHandler,
  updateUserEmailHandler,
  updateUserRoleActiveHandler,
} from '../controllers/user.controller';

const router = Router();

router.use(verifyToken);

router.put('/me/password', changeOwnPasswordHandler);

router.use(requireAdmin);
router.get('/', listUsersHandler);
router.post('/', createUserHandler);
router.put('/:id/email', updateUserEmailHandler);
router.put('/:id/role-active', updateUserRoleActiveHandler);
router.put('/:id/password', adminSetPasswordHandler);

export default router;
