import { Request, Response, NextFunction } from 'express';
import * as recommendationService from '../services/recommendationService';
import { sendSuccess, sendPaginatedSuccess } from '../utils/apiResponse';
import { parsePagination } from '../utils/queryParser';

export const getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { data, total } = await recommendationService.getRecommendations({}, skip, limit);
    return sendPaginatedSuccess(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getTopRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const top = await recommendationService.getTopRecommendations();
    return sendSuccess(res, top);
  } catch (error) {
    next(error);
  }
};

export const getRecommendationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await recommendationService.getRecommendationById(req.params.id as string);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
