import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', UserController.list);
router.put('/:id/role', authorize([Role.ADMIN]), UserController.updateRole);
router.delete('/:id', authorize([Role.ADMIN]), UserController.remove);

export default router;
