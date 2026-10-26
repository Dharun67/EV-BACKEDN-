import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as vehicleService from '../services/vehicleService';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/apiResponse';
import { parsePagination, parseSort } from '../utils/queryParser';

export const getVehicles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const sort = parseSort(req, ['brand', 'model', 'battery_capacity_kwh'], { brand: 1 });
    
    const query: any = {};
    if (req.user && req.user.role === 'USER') {
      query.userId = req.user._id.toString();
    }
    if (req.query.fleetId) query.fleet_id = req.query.fleetId;
    if (req.query.search) {
      query.$or = [
        { brand: new RegExp(req.query.search as string, 'i') },
        { model: new RegExp(req.query.search as string, 'i') }
      ];
    }
    
    const { data, total } = await vehicleService.getVehicles(query, skip, limit, sort);
    
    return sendPaginatedSuccess(res, data, {
      page, limit, total, totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id as string);
    if (!vehicle) return sendError(res, 'Vehicle not found', 404);
    return sendSuccess(res, vehicle);
  } catch (error) {
    next(error);
  }
};

export const getVehicleSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { data, total } = await vehicleService.getVehicleSessions(req.params.id as string, skip, limit);
    return sendPaginatedSuccess(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getVehicleEnergy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const energy = await vehicleService.getVehicleEnergy(req.params.id as string);
    return sendSuccess(res, energy);
  } catch (error) {
    next(error);
  }
};
