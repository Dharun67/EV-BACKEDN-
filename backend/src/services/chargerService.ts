import Charger from '../models/Charger';

export const getChargers = async (query: any = {}, skip: number = 0, limit: number = 20, sort: any = { createdAt: -1 }) => {
  const [data, total] = await Promise.all([
    Charger.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Charger.countDocuments(query)
  ]);
  return { data, total };
};

export const getChargerById = async (chargerId: string) => {
  return await Charger.findOne({ charger_id: chargerId }).lean();
};

export const getChargerStatistics = async () => {
  const stats = await Charger.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = stats.reduce((acc, curr) => acc + curr.count, 0);
  const formattedStats = {
    totalChargers: total,
    available: 0,
    occupied: 0,
    maintenance: 0,
    fault: 0,
    offline: 0
  };

  stats.forEach(stat => {
    const status = (stat._id || '').toLowerCase();
    if (status.includes('available') || status.includes('operational')) formattedStats.available += stat.count;
    else if (status.includes('occupied') || status.includes('in use')) formattedStats.occupied += stat.count;
    else if (status.includes('maintenance')) formattedStats.maintenance += stat.count;
    else if (status.includes('fault') || status.includes('error')) formattedStats.fault += stat.count;
    else formattedStats.offline += stat.count;
  });

  return formattedStats;
};
