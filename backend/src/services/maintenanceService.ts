import Maintenance from '../models/Maintenance';

export const getMaintenance = async (query: any = {}, skip: number = 0, limit: number = 20, sort: any = { createdAt: -1 }) => {
  const [data, total] = await Promise.all([
    Maintenance.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Maintenance.countDocuments(query)
  ]);
  return { data, total };
};

export const getMaintenanceStatistics = async () => {
  const [totalTasks, openTasks, criticalTasks] = await Promise.all([
    Maintenance.countDocuments(),
    Maintenance.countDocuments({ status: { $ne: 'RESOLVED' } } as any),
    Maintenance.countDocuments({ priority: 'CRITICAL' } as any)
  ]);

  return {
    totalTasks,
    openTasks,
    criticalTasks,
    completedTasks: totalTasks - openTasks,
    averageRepairCost: 0, // Calculate properly if cost field exists in future
    faultDistribution: {}
  };
};

export const getMaintenanceById = async (id: string) => {
  return await Maintenance.findOne({ maintenanceId: id }).lean();
};
