import prisma from '../config/db';

export class AnalyticsService {
  static async getTeamAnalytics() {
    // Overdue tasks per user
    const overdueTasks: any = await prisma.$queryRaw`
      SELECT u.email, COUNT(t.id)::int as "overdueCount"
      FROM "User" u
      JOIN "Task" t ON u.id = t."assigneeId"
      WHERE t."dueDate" < NOW() 
        AND t.status NOT IN ('DONE', 'BLOCKED')
      GROUP BY u.email
    `;

    // Average completion time in hours per user
    const avgCompletionTimes: any = await prisma.$queryRaw`
      SELECT u.email, AVG(EXTRACT(EPOCH FROM (t."updatedAt" - t."createdAt")) / 3600)::float as "avgCompletionTimeHours"
      FROM "User" u
      JOIN "Task" t ON u.id = t."assigneeId"
      WHERE t.status = 'DONE'
      GROUP BY u.email
    `;

    return {
      overdueTasks,
      avgCompletionTimes,
    };
  }
}
