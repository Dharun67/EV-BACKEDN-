import { Request, Response } from 'express';
import * as bookingService from '../services/bookingService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const checkFeasibility = async (req: Request, res: Response) => {
  try {
    const { stationId, date, startTime } = req.body;
    if (!stationId || !date || !startTime) {
      return sendError(res, 'Station ID, date, and startTime are required', 400);
    }
    const result = await bookingService.checkFeasibility(stationId, date, startTime);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const createBooking = async (req: any, res: Response) => {
  try {
    const bookingData = req.body;
    bookingData.userId = req.user._id.toString();
    
    if (!bookingData.stationId || !bookingData.chargerId || !bookingData.date || !bookingData.startTime) {
      return sendError(res, 'Missing required booking fields', 400);
    }
    
    const booking = await bookingService.createBooking(bookingData);
    sendSuccess(res, booking);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getUserBookings = async (req: any, res: Response) => {
  try {
    const userId = req.params.userId as string;
    
    // Auth check: User can only see their own bookings unless Admin
    if (req.user._id.toString() !== userId && req.user.role !== 'Admin') {
      return sendError(res, 'Forbidden: You can only view your own bookings', 403);
    }

    const bookings = await bookingService.getUserBookings(userId);
    sendSuccess(res, bookings);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAlternatives = async (req: Request, res: Response) => {
  try {
    const stationId = req.params.stationId as string;
    const alternatives = await bookingService.findAlternatives(stationId);
    sendSuccess(res, alternatives);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const autoRebook = async (req: any, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    
    // Verify booking belongs to user
    const userBookings = await bookingService.getUserBookings(req.user._id.toString());
    const bookingBelongsToUser = userBookings.some(b => b.bookingId === bookingId);
    
    if (!bookingBelongsToUser && req.user.role !== 'Admin') {
      return sendError(res, 'Forbidden: Cannot rebook this booking', 403);
    }

    const newBooking = await bookingService.autoRebook(bookingId);
    sendSuccess(res, newBooking);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
