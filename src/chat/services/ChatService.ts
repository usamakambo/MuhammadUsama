import { toUsageMonth } from '../../common/date.js';
import { AppError } from '../../common/errors.js';
import { config } from '../../common/config.js';
import { ChatMessage } from '../domain/ChatMessage.js';
import type { ChargedSource } from '../domain/ChatMessage.js';
import type { ChatMessageRepository } from '../repositories/ChatMessageRepository.js';
import type { MonthlyUsageRepository } from '../repositories/MonthlyUsageRepository.js';
import type { SubscriptionBundleRepository } from '../../subscriptions/repositories/SubscriptionBundleRepository.js';
import type { MockOpenAiService } from './MockOpenAiService.js';

export class ChatService {
  constructor(
    private readonly messages: ChatMessageRepository,
    private readonly monthlyUsage: MonthlyUsageRepository,
    private readonly subscriptions: SubscriptionBundleRepository,
    private readonly openAi: MockOpenAiService,
  ) {}

  async ask(input: { userId: string; question: string }): Promise<ChatMessage> {
    const now = new Date();
    let chargedSource: ChargedSource = 'free';

    const usedFree = await this.monthlyUsage.useFreeMessage(
      input.userId,
      toUsageMonth(now),
      config.freeMessagesPerMonth,
    );
    if (!usedFree) {
      await this.chargeBundle(input.userId, now);
      chargedSource = 'bundle';
    }

    const aiResponse = await this.openAi.answer(input.question);
    const message = ChatMessage.create({
      userId: input.userId,
      question: input.question,
      answer: aiResponse.answer,
      tokens: aiResponse.tokens,
      chargedSource,
      createdAt: now,
    });

    await this.messages.save(message);
    return message;
  }

  async listMessages(userId: string, limit: number): Promise<ChatMessage[]> {
    return this.messages.findByUser(userId, limit);
  }

  async getMonthlyUsage(userId: string) {
    const month = toUsageMonth(new Date());
    const { usedMessages } = await this.monthlyUsage.get(userId, month);
    const freeLimit = config.freeMessagesPerMonth;

    return {
      userId,
      month,
      freeLimit,
      usedMessages,
      remaining: Math.max(freeLimit - usedMessages, 0),
    };
  }

  private async chargeBundle(userId: string, now: Date): Promise<void> {
    const bundles = await this.subscriptions.findUsableByUser(userId, now);
    bundles.sort(
      (a, b) =>
        b.remainingMessages - a.remainingMessages ||
        b.renewalDate.getTime() - a.renewalDate.getTime(),
    );

    for (const bundle of bundles) {
      if (await this.subscriptions.useMessage(bundle, now)) {
        return;
      }
    }

    throw new AppError(
      'QUOTA_EXCEEDED',
      `You have used your ${config.freeMessagesPerMonth} free messages for this month. A valid subscription bundle is required.`,
      402,
    );
  }
}
