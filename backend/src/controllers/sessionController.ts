import { Request, Response, NextFunction } from 'express';
import * as sessionService from '../services/sessionService';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/apiResponse';
import { parsePagination, parseSort, parseDateRange } from '../utils/queryParser';

export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const sort = parseSort(req, ['start_time', 'energy_consumed_kwh', 'total_cost'], { start_time: -1 });
    
    const query: any = {};
    const dateRange = parseDateRange(req);
    if (dateRange) query.start_time = dateRange;
    if (req.query.stationId) query.station_id = req.query.stationId;
    if (req.query.vehicleId) query.vehicle_id = req.query.vehicleId;
    if (req.query.userId) query.user_id = req.query.userId;

    
    const { data, total } = await sessionService.getSessions(query, skip, limit, sort);
    
    return sendPaginatedSuccess(res, data, {
      page, limit, total, totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await sessionService.getSessionById(req.params.id as string);
    if (!session) return sendError(res, 'Session not found', 404);
    return sendSuccess(res, session);
  } catch (error) {
    next(error);
  }
};

export const getSessionsByStation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { data, total } = await sessionService.getSessions({ station_id: req.params.stationId as string }, skip, limit);
    return sendPaginatedSuccess(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getSessionsByVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { data, total } = await sessionService.getSessions({ vehicle_id: req.params.vehicleId as string }, skip, limit);
    return sendPaginatedSuccess(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getSessionStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: any = {};
    const dateRange = parseDateRange(req);
    if (dateRange) query.start_time = dateRange;

    const stats = await sessionService.getSessionStatistics(query);
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};
