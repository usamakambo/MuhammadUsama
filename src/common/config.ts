import 'dotenv/config';

const numberFromEnv = (key: string, fallback: number): number => {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${key} must be a number`);
  }

  return parsed;
};

export const config = {
  port: numberFromEnv('PORT', 3000),
  freeMessagesPerMonth: numberFromEnv('FREE_MESSAGES_PER_MONTH', 3),
  mockOpenAiDelayMs: numberFromEnv('MOCK_OPENAI_DELAY_MS', 750),
  paymentFailureRate: numberFromEnv('PAYMENT_FAILURE_RATE', 0.15),
};
