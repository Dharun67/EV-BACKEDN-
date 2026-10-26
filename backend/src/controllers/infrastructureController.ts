import { Request, Response, NextFunction } from 'express';
import * as infrastructureService from '../services/infrastructureService';
import { sendSuccess, sendPaginatedSuccess } from '../utils/apiResponse';
import { parsePagination } from '../utils/queryParser';

export const getInfrastructure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const query: any = {};
    if (req.query.zone) query.zone = new RegExp(req.query.zone as string, 'i');
    
    const { data, total } = await infrastructureService.getInfrastructure(query, skip, limit);
    return sendPaginatedSuccess(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getInfrastructureGaps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gaps = await infrastructureService.getInfrastructureGaps();
    return sendSuccess(res, gaps);
  } catch (error) {
    next(error);
  }
};
