import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/apiResponse';
import { parsePagination } from '../utils/queryParser';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { data, total } = await userService.getUsers({}, skip, limit);
    return sendPaginatedSuccess(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getUserStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await userService.getUserStatistics());
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.getUserById(req.params.id as string);
    if (!data) return sendError(res, 'User not found', 404);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
