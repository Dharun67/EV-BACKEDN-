import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/paymentService';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/apiResponse';
import { parsePagination } from '../utils/queryParser';

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { data, total } = await paymentService.getPayments({}, skip, limit);
    return sendPaginatedSuccess(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getPaymentSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await paymentService.getPaymentSummary());
  } catch (error) {
    next(error);
  }
};

export const getPaymentsByMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await paymentService.getPaymentsByMethod());
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await paymentService.getPaymentById(req.params.id as string);
    if (!data) return sendError(res, 'Payment not found', 404);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
