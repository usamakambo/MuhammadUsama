import express from 'express';
import { errorMiddleware } from './common/http/errorMiddleware.js';
import { prisma } from './common/persistence/prisma.js';
import { registerChatRoutes } from './chat/controllers/ChatController.js';
import { PrismaChatMessageRepository } from './chat/repositories/PrismaChatMessageRepository.js';
import { PrismaMonthlyUsageRepository } from './chat/repositories/PrismaMonthlyUsageRepository.js';
import { ChatService } from './chat/services/ChatService.js';
import { MockOpenAiService } from './chat/services/MockOpenAiService.js';
import { registerSubscriptionRoutes } from './subscriptions/controllers/SubscriptionController.js';
import { PrismaSubscriptionBundleRepository } from './subscriptions/repositories/PrismaSubscriptionBundleRepository.js';
import { SubscriptionService } from './subscriptions/services/SubscriptionService.js';

const bundleRepo = new PrismaSubscriptionBundleRepository(prisma);

export const subscriptionService = new SubscriptionService(bundleRepo);

const chatService = new ChatService(
  new PrismaChatMessageRepository(prisma),
  new PrismaMonthlyUsageRepository(prisma),
  bundleRepo,
  new MockOpenAiService(),
);

const router = express.Router();
registerChatRoutes(router, chatService);
registerSubscriptionRoutes(router, subscriptionService);

export const app = express();
app.use(express.json());
app.use(router);
app.use(errorMiddleware);
