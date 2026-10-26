export const getPayments = async (query: any = {}, skip: number = 0, limit: number = 20) => {
  return { data: [], total: 0 };
};

export const getPaymentSummary = async () => {
  return { totalRevenue: 0, totalTransactions: 0 };
};

export const getPaymentsByMethod = async () => {
  return [];
};

export const getPaymentById = async (id: string) => {
  return null;
};
