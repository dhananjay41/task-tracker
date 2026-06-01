import { Response } from 'express';
import { z } from 'zod';
import { TaskService } from '../services/taskService';
import { AuthRequest } from '../middleware/auth';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] as const;

const futureDatetime = z.iso
  .datetime()
  .refine((val) => new Date(val) > new Date(), { message: 'due_date must be a future date' });

const taskCreateSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.uuid(),
  dueDate: futureDatetime.optional().nullable(),
});

const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: z.enum(STATUSES).optional(),
});

function paramId(req: AuthRequest): string {
  return req.params['id'] as string;
}

export class TaskController {
  static async create(req: AuthRequest, res: Response) {
    const data = taskCreateSchema.parse(req.body);
    const task = await TaskService.createTask(data);

    req.app.get('io')?.to(task.assigneeId).emit('task_created', task);

    res.status(201).json(task);
  }

  static async list(req: AuthRequest, res: Response) {
    const q = req.query;
    const filters = {
      status: typeof q['status'] === 'string' ? q['status'] : undefined,
      priority: typeof q['priority'] === 'string' ? q['priority'] : undefined,
      assigneeId: typeof q['assigneeId'] === 'string' ? q['assigneeId'] : undefined,
    };
    const page = typeof q['page'] === 'string' ? Number(q['page']) || 1 : 1;
    const limit = typeof q['limit'] === 'string' ? Number(q['limit']) || 10 : 10;

    const result = await TaskService.getTasks(filters, page, limit, req.user!.id, req.user!.role);
    res.json(result);
  }

  static async getById(req: AuthRequest, res: Response) {
    const task = await TaskService.getTaskById(paramId(req), req.user!.id, req.user!.role);
    res.json(task);
  }

  static async update(req: AuthRequest, res: Response) {
    const data = taskUpdateSchema.parse(req.body);
    const task = await TaskService.updateTask(paramId(req), data, req.user!);

    const io = req.app.get('io');
    if (io) {
      if (data.status) io.to(task.assigneeId).emit('task_status_changed', task);
      if (data.assigneeId) io.to(task.assigneeId).emit('task_assigned', task);
    }

    res.json(task);
  }

  static async delete(req: AuthRequest, res: Response) {
    await TaskService.deleteTask(paramId(req));
    res.status(204).send();
  }
}
