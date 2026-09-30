import type { Router } from 'express';
import { AppError } from '../../common/errors.js';
import {
  asObject,
  idParam,
  limitQuery,
  requiredBoolean,
  requiredString,
} from '../../common/http/validation.js';
import { TIER_CATALOG } from '../domain/SubscriptionBundle.js';
import type {
  BillingCycle,
  SubscriptionBundle,
  SubscriptionTier,
} from '../domain/SubscriptionBundle.js';
import type { SubscriptionService } from '../services/SubscriptionService.js';

export const registerSubscriptionRoutes = (
  router: Router,
  subscriptions: SubscriptionService,
): void => {
  router.post('/subscriptions', async (req, res) => {
    const body = asObject(req.body);
    const tier = requiredString(body.tier, 'tier');
    const billingCycle = requiredString(body.billingCycle, 'billingCycle');

    if (!(tier in TIER_CATALOG)) {
      throw new AppError('VALIDATION_ERROR', 'tier must be basic, pro or enterprise', 400);
    }
    if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
      throw new AppError('VALIDATION_ERROR', 'billingCycle must be monthly or yearly', 400);
    }

    const bundle = await subscriptions.create({
      userId: requiredString(body.userId, 'userId'),
      tier: tier as SubscriptionTier,
      billingCycle: billingCycle as BillingCycle,
      autoRenew: body.autoRenew === undefined ? true : requiredBoolean(body.autoRenew, 'autoRenew'),
    });
    res.status(201).json({ data: toResponse(bundle) });
  });

  router.get('/subscriptions', async (req, res) => {
    const userId = requiredString(req.query.userId, 'userId');
    const bundles = await subscriptions.listByUser(userId, limitQuery(req.query.limit));
    res.json({ data: bundles.map(toResponse) });
  });

  router.patch('/subscriptions/:id/cancel', async (req, res) => {
    const bundle = await subscriptions.cancel(idParam(req.params.id));
    res.json({ data: toResponse(bundle) });
  });

  router.patch('/subscriptions/:id/auto-renew', async (req, res) => {
    const body = asObject(req.body);
    const bundle = await subscriptions.setAutoRenew(
      idParam(req.params.id),
      requiredBoolean(body.autoRenew, 'autoRenew'),
    );
    res.json({ data: toResponse(bundle) });
  });

  router.post('/subscriptions/renewals/process', async (_req, res) => {
    const { renewed, failed } = await subscriptions.processRenewals();
    res.json({ data: { renewed: renewed.map(toResponse), failed: failed.map(toResponse) } });
  });
};

const toResponse = (bundle: SubscriptionBundle) => ({
  id: bundle.id,
  userId: bundle.userId,
  tier: bundle.tier,
  billingCycle: bundle.billingCycle,
  status: bundle.status,
  autoRenew: bundle.autoRenew,
  maxMessages: bundle.maxMessages,
  usedMessages: bundle.usedMessages,
  price: bundle.priceCents / 100,
  startDate: bundle.startDate,
  endDate: bundle.endDate,
  renewalDate: bundle.renewalDate,
});
