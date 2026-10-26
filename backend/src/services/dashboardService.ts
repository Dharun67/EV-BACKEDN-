import Station from '../models/Station';
import Charger from '../models/Charger';
import ChargingSession from '../models/ChargingSession';
import DemandData from '../models/DemandData';

export const getDashboardOverview = async () => {
  const [
    stationsCount,
    chargersCount,
    availableChargers,
    activeSessions,
    energyTodayStats,
    revenueTodayStats
  ] = await Promise.all([
    Station.countDocuments(),
    Charger.countDocuments(),
    Charger.countDocuments({ status: { $regex: /operational|available/i } }),
    ChargingSession.countDocuments({ status: 'CHARGING' }),
    
    // Example: Energy today (mocking today for demo using all sessions since data might be older)
    ChargingSession.aggregate([
      { $group: { _id: null, totalEnergy: { $sum: '$energy_consumed_kwh' } } }
    ]),
    
    // Example: Revenue today
    ChargingSession.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$total_cost' } } }
    ])
  ]);

  return {
    stations: stationsCount,
    chargers: chargersCount,
    availableChargers,
    activeSessions,
    energyToday: energyTodayStats.length ? energyTodayStats[0].totalEnergy : 0,
    revenueToday: revenueTodayStats.length ? revenueTodayStats[0].totalRevenue : 0,
    networkUtilization: chargersCount ? (activeSessions / chargersCount) * 100 : 0,
    maintenanceIssues: chargersCount - availableChargers - activeSessions, // rough estimate
    highDemandZones: 5 // mock value for now, could be dynamic
  };
};
