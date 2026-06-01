import { Router } from 'express';
import authRoutes from './auth';
import taskRoutes from './tasks';
import analyticsRoutes from './analytics';
import usersRoutes from './users';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', usersRoutes);

router.get('/', (_req, res) => {
  res.json({ message: 'Welcome to Team Task Tracker API' });
});

export default router;
