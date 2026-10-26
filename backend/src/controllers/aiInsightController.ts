import { Request, Response, NextFunction } from 'express';
import * as aiInsightService from '../services/aiInsightService';
import { sendSuccess } from '../utils/apiResponse';

export const getAIInsights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const insights = await aiInsightService.getAIInsights();
    return sendSuccess(res, insights);
  } catch (error) {
    next(error);
  }
};
