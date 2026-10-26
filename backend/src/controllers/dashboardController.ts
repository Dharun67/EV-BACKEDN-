import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';
import { sendSuccess } from '../utils/apiResponse';

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await dashboardService.getDashboardOverview();
    return sendSuccess(res, overview);
  } catch (error) {
    next(error);
  }
};
