import { Request, Response } from 'express';
import * as queueService from '../services/queueService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const joinQueue = async (req: Request, res: Response) => {
  try {
    const { stationId, vehicleId } = req.body;
    const userId = (req as any).user?._id;
    if (!stationId || !vehicleId || !userId) {
      return sendError(res, 'Station ID, Vehicle ID, and User Authorization are required', 400);
    }
    const result = await queueService.joinQueue(stationId, vehicleId, userId.toString());
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.message.includes('temporarily unavailable')) {
      return sendError(res, error.message, 503);
    }
    sendError(res, error.message, 400);
  }
};

export const leaveQueue = async (req: Request, res: Response) => {
  try {
    const { stationId, vehicleId } = req.body;
    if (!stationId || !vehicleId) {
      return sendError(res, 'Station ID and Vehicle ID are required', 400);
    }
    const result = await queueService.leaveQueue(stationId, vehicleId);
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.message.includes('temporarily unavailable')) {
      return sendError(res, error.message, 503);
    }
    sendError(res, error.message, 400);
  }
};

export const getQueuePosition = async (req: Request, res: Response) => {
  try {
    const stationId = req.params.stationId as string;
    const vehicleId = req.params.vehicleId as string;
    const result = await queueService.getQueueState(stationId, vehicleId);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const getStationQueue = async (req: Request, res: Response) => {
  try {
    const stationId = req.params.stationId as string;
    const result = await queueService.getQueueState(stationId);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const getQueueSize = async (req: Request, res: Response) => {
  try {
    const stationId = req.params.stationId as string;
    const length = await queueService.getQueueSize(stationId);
    sendSuccess(res, { stationId, queueLength: length });
  } catch (error: any) {
    if (error.message.includes('temporarily unavailable')) {
      return sendError(res, error.message, 503);
    }
    sendError(res, error.message, 400);
  }
};

export const startSession = async (req: Request, res: Response) => {
  try {
    const { stationId, vehicleId, chargerId } = req.body;
    if (!stationId || !vehicleId || !chargerId) {
      return sendError(res, 'Station ID, Vehicle ID, and Charger ID are required', 400);
    }
    const result = await queueService.startSession(stationId, vehicleId, chargerId);
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.message.includes('temporarily unavailable')) {
      return sendError(res, error.message, 503);
    }
    sendError(res, error.message, 400);
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const { stationId, vehicleId, chargerId } = req.body;
    if (!stationId || !vehicleId || !chargerId) {
      return sendError(res, 'Station ID, Vehicle ID, and Charger ID are required', 400);
    }
    const result = await queueService.endSession(stationId, vehicleId, chargerId);
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.message.includes('temporarily unavailable')) {
      return sendError(res, error.message, 503);
    }
    sendError(res, error.message, 400);
  }
};
