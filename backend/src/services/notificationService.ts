export const getNotifications = async (query: any = {}, skip: number = 0, limit: number = 20) => {
  return { data: [], total: 0 };
};

export const getUnreadNotifications = async () => {
  return [];
};

export const getNotificationById = async (id: string) => {
  return null;
};
