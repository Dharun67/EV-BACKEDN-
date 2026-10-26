import DemandData from '../models/DemandData';

export const getDemand = async (query: any = {}, skip: number = 0, limit: number = 20, sort: any = { timestamp: -1 }) => {
  const [data, total] = await Promise.all([
    DemandData.find(query).sort(sort).skip(skip).limit(limit).lean(),
    DemandData.countDocuments(query)
  ]);
  return { data, total };
};

export const getDemandSummary = async () => {
  const stats = await DemandData.aggregate([
    {
      $group: {
        _id: null,
        avgDemandScore: { $avg: '$demandScore' },
        peakDemand: { $max: '$demandScore' },
        totalSessionsForecast: { $sum: '$sessions' }
      }
    }
  ]);
  return stats.length > 0 ? stats[0] : { avgDemandScore: 0, peakDemand: 0, totalSessionsForecast: 0 };
};

export const getPeakDemand = async () => {
  return await DemandData.find().sort({ demandScore: -1 }).limit(10).lean();
};

export const getDemandByZone = async () => {
  return await DemandData.aggregate([
    {
      $group: {
        _id: '$zone',
        avgDemand: { $avg: '$demandScore' },
        totalEnergy: { $sum: '$energyDemandKwh' }
      }
    },
    { $sort: { avgDemand: -1 } }
  ]);
};

export const getDemandTrend = async (query: any) => {
  // Aggregate by day to show a trend over time
  return await DemandData.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        avgDemand: { $avg: '$demandScore' },
        peakDemand: { $max: '$demandScore' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};
