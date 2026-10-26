import { Request, Response, NextFunction } from 'express';
import * as fleetService from '../services/fleetService';
import { sendSuccess } from '../utils/apiResponse';

export const getFleetStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await fleetService.getFleetStatistics();
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getFleet = async (req: Request, res: Response, next: NextFunction) => {
  // Mock response since we don't have a fleets collection
  return sendSuccess(res, []);
};
