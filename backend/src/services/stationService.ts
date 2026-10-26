import Station from '../models/Station';
import Charger from '../models/Charger';
import ChargingSession from '../models/ChargingSession';

export const getStations = async (query: any = {}, skip: number = 0, limit: number = 20, sort: any = { station_name: 1 }) => {
  const [data, total] = await Promise.all([
    Station.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Station.countDocuments(query)
  ]);
  return { data, total };
};

export const createStation = async (stationData: any) => {
  const newStation = new Station({
    ...stationData,
    stationId: `st_${Date.now()}`
  });
  return await newStation.save();
};

export const getStationById = async (stationId: string) => {
  return await Station.findOne({ station_id: stationId }).lean();
};

export const getStationChargers = async (stationId: string) => {
  return await Charger.find({ station_id: stationId }).lean();
};

export const getStationSessions = async (stationId: string, skip: number = 0, limit: number = 20) => {
  const [data, total] = await Promise.all([
    ChargingSession.find({ station_id: stationId }).sort({ start_time: -1 }).skip(skip).limit(limit).lean(),
    ChargingSession.countDocuments({ station_id: stationId })
  ]);
  return { data, total };
};

export const getStationStatistics = async (stationId: string) => {
  // Use aggregation to calculate statistics for this specific station
  const stats = await ChargingSession.aggregate([
    { $match: { station_id: stationId } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalEnergy: { $sum: '$energy_consumed_kwh' },
        totalCost: { $sum: '$total_cost' },
        avgDuration: { $avg: '$duration_minutes' }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : { totalSessions: 0, totalEnergy: 0, totalCost: 0, avgDuration: 0 };
};
