import ChargingSession from '../models/ChargingSession';

export const getRevenueSummary = async (query: any = {}) => {
  const stats = await ChargingSession.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total_cost' },
        avgRevenuePerSession: { $avg: '$total_cost' },
        totalSessions: { $sum: 1 }
      }
    }
  ]);
  return stats.length > 0 ? stats[0] : { totalRevenue: 0, avgRevenuePerSession: 0, totalSessions: 0 };
};

export const getRevenueTrend = async (query: any = {}) => {
  return await ChargingSession.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: '$start_time' },
          month: { $month: '$start_time' },
          day: { $dayOfMonth: '$start_time' }
        },
        revenue: { $sum: '$total_cost' },
        sessions: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

export const getRevenueByStation = async (query: any = {}) => {
  return await ChargingSession.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$station_id',
        revenue: { $sum: '$total_cost' },
        sessions: { $sum: 1 },
        energy: { $sum: '$energy_consumed_kwh' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 50 }
  ]);
};
