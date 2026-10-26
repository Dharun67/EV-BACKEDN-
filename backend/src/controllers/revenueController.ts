import { Request, Response, NextFunction } from 'express';
import * as revenueService from '../services/revenueService';
import { sendSuccess } from '../utils/apiResponse';
import { parseDateRange } from '../utils/queryParser';

export const getRevenueSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: any = {};
    const dateRange = parseDateRange(req);
    if (dateRange) query.start_time = dateRange;

    const summary = await revenueService.getRevenueSummary(query);
    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

export const getRevenueTrend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: any = {};
    const dateRange = parseDateRange(req);
    if (dateRange) query.start_time = dateRange;

    const trend = await revenueService.getRevenueTrend(query);
    return sendSuccess(res, trend);
  } catch (error) {
    next(error);
  }
};

export const getRevenueByStation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: any = {};
    const dateRange = parseDateRange(req);
    if (dateRange) query.start_time = dateRange;

    const byStation = await revenueService.getRevenueByStation(query);
    return sendSuccess(res, byStation);
  } catch (error) {
    next(error);
  }
};

export const getRevenue = async (req: Request, res: Response, next: NextFunction) => {
  // Base endpoint can just return the summary for now
  return getRevenueSummary(req, res, next);
};
