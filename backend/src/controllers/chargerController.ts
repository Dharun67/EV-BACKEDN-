import { Request, Response, NextFunction } from 'express';
import * as chargerService from '../services/chargerService';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/apiResponse';
import { parsePagination, parseSort } from '../utils/queryParser';
import Charger from '../models/Charger';

export const getChargers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const sort = parseSort(req, ['power_kw', 'status']);
    
    const query: any = {};
    if (req.query.status) query.status = new RegExp(req.query.status as string, 'i');
    if (req.query.type) query.connector_type = new RegExp(req.query.type as string, 'i');
    if (req.query.stationId) query.station_id = req.query.stationId;
    
    const { data, total } = await chargerService.getChargers(query, skip, limit, sort);
    
    return sendPaginatedSuccess(res, data, {
      page, limit, total, totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getChargerStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await chargerService.getChargerStatistics();
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getChargerById = async (req: Request, res: Response) => {
  try {
    const charger = await Charger.findOne({ chargerId: req.params.chargerId });
    if (!charger) {
      return sendError(res, 'Charger not found', 404);
    }
    sendSuccess(res, charger);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const updateChargerStatus = async (req: Request, res: Response) => {
  try {
    const { chargerId } = req.params;
    const { status } = req.body; // e.g. AVAILABLE, OCCUPIED, FAULT, MAINTENANCE, OFFLINE
    
    if (!['AVAILABLE', 'OCCUPIED', 'FAULT', 'MAINTENANCE', 'OFFLINE'].includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const charger = await Charger.findOneAndUpdate(
      { chargerId },
      { status, lastUpdated: new Date() },
      { new: true }
    );

    if (!charger) {
      return sendError(res, 'Charger not found', 404);
    }

    // Attempt to update real-time Redis state if available
    import('../config/redis').then(async ({ default: redisClient }) => {
      if (redisClient.status === 'ready') {
        const oldStatus = await redisClient.get(`charger:${chargerId}:status`) || 'AVAILABLE';
        await redisClient.set(`charger:${chargerId}:status`, status);
        
        const availKey = `station:${charger.stationId}:availability`;
        
        // Decrement old status count
        if (oldStatus === 'AVAILABLE') await redisClient.hincrby(availKey, 'availableChargers', -1);
        if (oldStatus === 'OCCUPIED') await redisClient.hincrby(availKey, 'occupiedChargers', -1);
        if (oldStatus === 'FAULT') await redisClient.hincrby(availKey, 'faultedChargers', -1);
        if (oldStatus === 'MAINTENANCE') await redisClient.hincrby(availKey, 'maintenanceChargers', -1);

        // Increment new status count
        if (status === 'AVAILABLE') await redisClient.hincrby(availKey, 'availableChargers', 1);
        if (status === 'OCCUPIED') await redisClient.hincrby(availKey, 'occupiedChargers', 1);
        if (status === 'FAULT') await redisClient.hincrby(availKey, 'faultedChargers', 1);
        if (status === 'MAINTENANCE') await redisClient.hincrby(availKey, 'maintenanceChargers', 1);
        
        const { emitToStation } = require('../socket');
        emitToStation(charger.stationId, 'charger:statusChanged', { chargerId, status });
        const newAvailability = await redisClient.hgetall(availKey);
        emitToStation(charger.stationId, 'station:availabilityChanged', newAvailability);
      }
    }).catch(console.error);

    sendSuccess(res, charger);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};
