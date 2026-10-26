import ChargingSession from '../models/ChargingSession';

export const getSessions = async (query: any = {}, skip: number = 0, limit: number = 20, sort: any = { start_time: -1 }) => {
  const [data, total] = await Promise.all([
    ChargingSession.find(query).sort(sort).skip(skip).limit(limit).lean(),
    ChargingSession.countDocuments(query)
  ]);
  return { data, total };
};

export const getSessionById = async (sessionId: string) => {
  return await ChargingSession.findOne({ session_id: sessionId }).lean();
};

export const getSessionStatistics = async (query: any = {}) => {
  const stats = await ChargingSession.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalEnergy: { $sum: '$energy_consumed_kwh' },
        avgDuration: { $avg: '$duration_minutes' },
        avgEnergyPerSession: { $avg: '$energy_consumed_kwh' },
        avgCostPerSession: { $avg: '$total_cost' }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : {
    totalSessions: 0,
    totalEnergy: 0,
    avgDuration: 0,
    avgEnergyPerSession: 0,
    avgCostPerSession: 0
  };
};
