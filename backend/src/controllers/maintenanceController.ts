import { Request, Response, NextFunction } from 'express';
import * as maintenanceService from '../services/maintenanceService';
import { sendSuccess, sendPaginatedSuccess } from '../utils/apiResponse';
import { parsePagination, parseSort } from '../utils/queryParser';

export const getMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const sort = parseSort(req, ['priority', 'status', 'createdAt'], { createdAt: -1 });
    
    const query: any = {};
    if (req.query.priority) query.priority = new RegExp(req.query.priority as string, 'i');
    if (req.query.status) query.status = new RegExp(req.query.status as string, 'i');
    if (req.query.stationId) query.station_id = req.query.stationId;
    
    const { data, total } = await maintenanceService.getMaintenance(query, skip, limit, sort);
    
    return sendPaginatedSuccess(res, data, {
      page, limit, total, totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await maintenanceService.getMaintenanceStatistics();
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await maintenanceService.getMaintenanceById(req.params.id as string);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
