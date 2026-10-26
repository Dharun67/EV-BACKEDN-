import { Request, Response, NextFunction } from 'express';
import * as stationService from '../services/stationService';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/apiResponse';
import { parsePagination, parseSort } from '../utils/queryParser';

export const getStations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const sort = parseSort(req, ['station_name', 'power_kw'], { station_name: 1 });
    
    // Build query filters
    const query: any = {};
    if (req.query.zone) query.city = new RegExp(req.query.zone as string, 'i');
    if (req.query.status) query.status = req.query.status;
    if (req.query.chargerType) query.connector_type = new RegExp(req.query.chargerType as string, 'i');
    if (req.query.minPower) query.power_kw = { $gte: Number(req.query.minPower) };
    
    const { data, total } = await stationService.getStations(query, skip, limit, sort);
    
    return sendPaginatedSuccess(res, data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const createStation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const stationData = {
      ...req.body,
      hostId: user._id,
      hostName: user.name,
      rating: 5,
      totalChargers: 1,
      availableChargers: 1
    };
    const station = await stationService.createStation(stationData);
    return sendSuccess(res, station, 201);
  } catch (error) {
    next(error);
  }
};

export const searchStations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q) return sendError(res, 'Search query "q" is required', 400);

    const query = {
      $or: [
        { station_name: new RegExp(q, 'i') },
        { address: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') }
      ]
    };

    const { page, limit, skip } = parsePagination(req);
    const { data, total } = await stationService.getStations(query, skip, limit, { station_name: 1 });
    
    return sendPaginatedSuccess(res, data, {
      page, limit, total, totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getStationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const station = await stationService.getStationById(req.params.id as string);
    if (!station) return sendError(res, 'Station not found', 404);
    return sendSuccess(res, station);
  } catch (error) {
    next(error);
  }
};

export const getStationChargers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chargers = await stationService.getStationChargers(req.params.id as string);
    return sendSuccess(res, chargers);
  } catch (error) {
    next(error);
  }
};

export const getStationSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { data, total } = await stationService.getStationSessions(req.params.id as string, skip, limit);
    return sendPaginatedSuccess(res, data, {
      page, limit, total, totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getStationStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await stationService.getStationStatistics(req.params.id as string);
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};
