import prisma from '../config/db';
import redis from '../config/redis';
import { Status, Priority, Role } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class TaskService {
  private static readonly CACHE_PREFIX = 'tasks:assignee:';
  private static readonly CACHE_TTL = 3600;

  static async createTask(data: {
    title: string;
    description?: string;
    priority?: Priority;
    assigneeId: string;
    dueDate?: string | null;
  }) {
    const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
    if (!assignee) throw new AppError('Assignee not found', 404, 'NOT_FOUND');

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority ?? Priority.MEDIUM,
        status: Status.TODO,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: { assignee: { select: { id: true, email: true, role: true } } },
    });

    await this.invalidateCache(task.assigneeId);
    return task;
  }

  static async getTaskById(id: string, userId: string, userRole: Role) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignee: { select: { id: true, email: true, role: true } } },
    });

    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

    if (userRole === Role.MEMBER && task.assigneeId !== userId) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    return task;
  }

  static async getTasks(
    filters: { status?: string; priority?: string; assigneeId?: string },
    page: number,
    limit: number,
    userId: string,
    userRole: Role,
  ) {
    const skip = (page - 1) * limit;

    const where: { assigneeId?: string; status?: Status; priority?: Priority } = {};

    if (userRole === Role.MEMBER) {
      where.assigneeId = userId;
    } else if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters.status) where.status = filters.status as Status;
    if (filters.priority) where.priority = filters.priority as Priority;

    // Cache only MEMBER queries (bounded scope, high frequency)
    const cacheKey = `${this.CACHE_PREFIX}${userId}:${JSON.stringify(where)}:${page}:${limit}`;
    if (userRole === Role.MEMBER) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Cache hit: returning cached task list');
        return JSON.parse(cached);
      }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { assignee: { select: { id: true, email: true, role: true } } },
      }),
      prisma.task.count({ where }),
    ]);

    const result = {
      tasks,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };

    if (userRole === Role.MEMBER) {
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    }

    return result;
  }

  static async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: Priority;
      status?: Status;
      assigneeId?: string;
      dueDate?: string | null;
    },
    user: { id: string; role: Role },
  ) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

    // MEMBERs may only touch their own tasks
    if (user.role === Role.MEMBER && task.assigneeId !== user.id) {
      throw new AppError('Cannot update tasks not assigned to you', 403, 'FORBIDDEN');
    }

    if (data.status && data.status !== task.status) {
      this.validateStatusTransition(task.status, data.status);
    }

    if (data.assigneeId && data.assigneeId !== task.assigneeId) {
      const newAssignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
      if (!newAssignee) throw new AppError('Assignee not found', 404, 'NOT_FOUND');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate !== undefined
          ? (data.dueDate ? new Date(data.dueDate) : null)
          : undefined,
      },
      include: { assignee: { select: { id: true, email: true, role: true } } },
    });

    await this.invalidateCache(task.assigneeId);
    if (data.assigneeId && data.assigneeId !== task.assigneeId) {
      await this.invalidateCache(data.assigneeId);
    }

    return updatedTask;
  }

  static async deleteTask(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

    await prisma.task.delete({ where: { id } });
    await this.invalidateCache(task.assigneeId);
  }

  // Exposed (not private) so unit tests can call it directly
  static validateStatusTransition(current: Status, next: Status): void {
    if (next === Status.BLOCKED) return; // BLOCKED reachable from any active state

    const allowed: Record<Status, Status[]> = {
      [Status.TODO]: [Status.IN_PROGRESS],
      [Status.IN_PROGRESS]: [Status.IN_REVIEW],
      [Status.IN_REVIEW]: [Status.DONE],
      [Status.DONE]: [],
      [Status.BLOCKED]: [Status.TODO, Status.IN_PROGRESS, Status.IN_REVIEW, Status.DONE],
    };

    if (!allowed[current].includes(next)) {
      throw new AppError(
        `Cannot transition from ${current} to ${next}`,
        400,
        'INVALID_TRANSITION',
      );
    }
  }

  private static async invalidateCache(assigneeId: string) {
    try {
      const keys = await redis.keys(`${this.CACHE_PREFIX}${assigneeId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.error('Redis cache invalidation failed', err);
    }
  }
}
