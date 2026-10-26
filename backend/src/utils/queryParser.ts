import { Request } from 'express';

export const parsePagination = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // max 100
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const parseSort = (req: Request, allowedFields: string[], defaultSort: any = { createdAt: -1 }) => {
  const sortField = req.query.sort as string;
  const order = req.query.order === 'asc' ? 1 : -1;

  if (sortField && allowedFields.includes(sortField)) {
    return { [sortField]: order };
  }

  return defaultSort;
};

export const parseDateRange = (req: Request) => {
  const { startDate, endDate, range } = req.query;
  const dateFilter: any = {};

  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      dateFilter.$gte = start;
      dateFilter.$lte = end;
      return dateFilter;
    }
  }

  if (range) {
    const now = new Date();
    dateFilter.$lte = now;

    switch (range) {
      case 'today':
        dateFilter.$gte = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7d':
        dateFilter.$gte = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        dateFilter.$gte = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        dateFilter.$gte = new Date(now.setDate(now.getDate() - 90));
        break;
      case '6m':
        dateFilter.$gte = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1y':
        dateFilter.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }
    if (dateFilter.$gte) return dateFilter;
  }

  return null;
};
