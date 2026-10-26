import Infrastructure from '../models/Infrastructure';

export const getInfrastructure = async (query: any = {}, skip: number = 0, limit: number = 20) => {
  const [data, total] = await Promise.all([
    Infrastructure.find(query).skip(skip).limit(limit).lean(),
    Infrastructure.countDocuments(query)
  ]);
  return { data, total };
};

export const getInfrastructureGaps = async () => {
  // Mock logic since actual Infrastructure raw data doesn't exist yet
  return [];
};
