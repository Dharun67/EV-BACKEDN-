import Vehicle from '../models/Vehicle';
import ChargingSession from '../models/ChargingSession';

export const getVehicles = async (query: any = {}, skip: number = 0, limit: number = 20, sort: any = { brand: 1 }) => {
  const [data, total] = await Promise.all([
    Vehicle.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Vehicle.countDocuments(query)
  ]);
  return { data, total };
};

export const getVehicleById = async (vehicleId: string) => {
  return await Vehicle.findOne({ brand: { $regex: new RegExp(vehicleId, 'i') } }).lean(); // Our data uses brand+model, but ID lookup might need adjustments. For now, assuming vehicle_id in sessions maps to something or we can just fetch.
};

export const getVehicleSessions = async (vehicleId: string, skip: number = 0, limit: number = 20) => {
  const [data, total] = await Promise.all([
    ChargingSession.find({ vehicle_id: vehicleId }).sort({ start_time: -1 }).skip(skip).limit(limit).lean(),
    ChargingSession.countDocuments({ vehicle_id: vehicleId })
  ]);
  return { data, total };
};

export const getVehicleEnergy = async (vehicleId: string) => {
  const stats = await ChargingSession.aggregate([
    { $match: { vehicle_id: vehicleId } },
    {
      $group: {
        _id: null,
        totalEnergy: { $sum: '$energy_consumed_kwh' },
        avgEnergyPerSession: { $avg: '$energy_consumed_kwh' }
      }
    }
  ]);
  return stats.length > 0 ? stats[0] : { totalEnergy: 0, avgEnergyPerSession: 0 };
};
