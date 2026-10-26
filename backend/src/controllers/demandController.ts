import { Request, Response, NextFunction } from 'express';
import * as demandService from '../services/demandService';
import { sendSuccess, sendPaginatedSuccess } from '../utils/apiResponse';
import { parsePagination, parseSort, parseDateRange } from '../utils/queryParser';

export const getDemand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const sort = parseSort(req, ['timestamp', 'demandScore', 'energyDemandKwh'], { timestamp: -1 });
    
    const query: any = {};
    const dateRange = parseDateRange(req);
    if (dateRange) query.timestamp = dateRange;
    if (req.query.zone) query.zone = new RegExp(req.query.zone as string, 'i');
    
    const { data, total } = await demandService.getDemand(query, skip, limit, sort);
    
    return sendPaginatedSuccess(res, data, {
      page, limit, total, totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getDemandSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await demandService.getDemandSummary();
    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

export const getPeakDemand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const peaks = await demandService.getPeakDemand();
    return sendSuccess(res, peaks);
  } catch (error) {
    next(error);
  }
};

export const getDemandByZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zones = await demandService.getDemandByZone();
    return sendSuccess(res, zones);
  } catch (error) {
    next(error);
  }
};

export const getDemandTrend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: any = {};
    const dateRange = parseDateRange(req);
    if (dateRange) query.timestamp = dateRange;

    const trend = await demandService.getDemandTrend(query);
    return sendSuccess(res, trend);
  } catch (error) {
    next(error);
  }
};
