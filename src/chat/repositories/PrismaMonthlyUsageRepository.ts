import type { PrismaClient } from '@prisma/client';
import type { MonthlyUsage, MonthlyUsageRepository } from './MonthlyUsageRepository.js';

export class PrismaMonthlyUsageRepository implements MonthlyUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(userId: string, usageMonth: string): Promise<MonthlyUsage> {
    const usage = await this.prisma.monthlyFreeUsage.findUnique({
      where: { userId_usageMonth: { userId, usageMonth } },
    });

    return usage ?? { userId, usageMonth, usedMessages: 0 };
  }

  async useFreeMessage(userId: string, usageMonth: string, limit: number): Promise<boolean> {
    await this.prisma.monthlyFreeUsage.createMany({
      data: [{ userId, usageMonth }],
      skipDuplicates: true,
    });

    const result = await this.prisma.monthlyFreeUsage.updateMany({
      where: { userId, usageMonth, usedMessages: { lt: limit } },
      data: { usedMessages: { increment: 1 } },
    });

    return result.count > 0;
  }
}
