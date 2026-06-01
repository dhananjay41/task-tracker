import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  static async getAnalytics(req: Request, res: Response) {
    const analytics = await AnalyticsService.getTeamAnalytics();
    res.json(analytics);
  }
}
