import { Response } from 'express';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = (res: Response, data: any, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendPaginatedSuccess = (res: Response, data: any, pagination: PaginationData, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination
  });
};

export const sendError = (res: Response, message: string, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};
