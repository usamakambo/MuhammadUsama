import type { Router } from 'express';
import { asObject, limitQuery, requiredString } from '../../common/http/validation.js';
import type { ChatMessage } from '../domain/ChatMessage.js';
import type { ChatService } from '../services/ChatService.js';

export const registerChatRoutes = (router: Router, chat: ChatService): void => {
  router.post('/chat/messages', async (req, res) => {
    const body = asObject(req.body);
    const message = await chat.ask({
      userId: requiredString(body.userId, 'userId'),
      question: requiredString(body.question, 'question'),
    });
    res.status(201).json({ data: toResponse(message) });
  });

  router.get('/chat/messages', async (req, res) => {
    const userId = requiredString(req.query.userId, 'userId');
    const messages = await chat.listMessages(userId, limitQuery(req.query.limit));
    res.json({ data: messages.map(toResponse) });
  });

  router.get('/usage/monthly', async (req, res) => {
    const userId = requiredString(req.query.userId, 'userId');
    res.json({ data: await chat.getMonthlyUsage(userId) });
  });
};

const toResponse = (message: ChatMessage) => ({
  id: message.id,
  userId: message.userId,
  question: message.question,
  answer: message.answer,
  tokens: message.tokens,
  chargedSource: message.chargedSource,
  createdAt: message.createdAt,
});
