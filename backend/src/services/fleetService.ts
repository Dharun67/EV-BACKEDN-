import Vehicle from '../models/Vehicle';
import ChargingSession from '../models/ChargingSession';

// Since fleet dataset doesn't explicitly exist as a collection in our raw data,
// we will aggregate from vehicles/sessions for the statistics.

export const getFleetStatistics = async () => {
  const [totalVehicles, activeSessions] = await Promise.all([
    Vehicle.countDocuments(),
    ChargingSession.countDocuments({ status: 'CHARGING' }) // Assuming active is CHARGING
  ]);

  return {
    totalVehicles,
    activeVehicles: totalVehicles, // Example calc
    chargingVehicles: activeSessions,
    availableVehicles: totalVehicles - activeSessions,
    averageBattery: 65, // Example placeholder if real data doesn't provide current SOC for all
    energyConsumption: 0,
    fleetUtilization: totalVehicles ? (activeSessions / totalVehicles) * 100 : 0
  };
};
