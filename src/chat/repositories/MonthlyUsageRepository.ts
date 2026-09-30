export interface MonthlyUsage {
  userId: string;
  usageMonth: string;
  usedMessages: number;
}

export interface MonthlyUsageRepository {
  get(userId: string, usageMonth: string): Promise<MonthlyUsage>;
  useFreeMessage(userId: string, usageMonth: string, limit: number): Promise<boolean>;
}
