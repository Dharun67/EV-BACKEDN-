import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';
import { sendSuccess } from '../utils/apiResponse';

export const getNetworkAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendSuccess(res, await analyticsService.getNetworkAnalytics()); } catch (error) { next(error); }
};

export const getEnergyAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendSuccess(res, await analyticsService.getEnergyAnalytics()); } catch (error) { next(error); }
};

export const getUtilizationAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendSuccess(res, await analyticsService.getUtilizationAnalytics()); } catch (error) { next(error); }
};

export const getSessionAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendSuccess(res, await analyticsService.getSessionAnalytics()); } catch (error) { next(error); }
};

export const getStationAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendSuccess(res, await analyticsService.getStationAnalytics()); } catch (error) { next(error); }
};
