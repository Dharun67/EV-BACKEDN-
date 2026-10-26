export const getUsers = async (query: any = {}, skip: number = 0, limit: number = 20) => {
  return { data: [], total: 0 };
};

export const getUserStatistics = async () => {
  return { totalUsers: 0, activeUsers: 0 };
};

export const getUserById = async (id: string) => {
  return null;
};
