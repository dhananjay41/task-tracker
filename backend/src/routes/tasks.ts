import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post('/', authorize([Role.ADMIN, Role.MANAGER]), TaskController.create);
router.get('/', TaskController.list);
router.get('/:id', TaskController.getById);
router.put('/:id', TaskController.update);
router.delete('/:id', authorize([Role.ADMIN, Role.MANAGER]), TaskController.delete);

export default router;
