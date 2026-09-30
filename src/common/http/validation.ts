import { AppError } from '../errors.js';

const badRequest = (message: string) => new AppError('VALIDATION_ERROR', message, 400);

export const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest('Request body must be a JSON object');
  }
  return value as Record<string, unknown>;
};

export const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
};

export const requiredBoolean = (value: unknown, field: string): boolean => {
  if (typeof value !== 'boolean') {
    throw badRequest(`${field} must be true or false`);
  }
  return value;
};

export const idParam = (value: unknown): string => {
  const id = requiredString(value, 'id');
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw badRequest('id must be a valid UUID');
  }
  return id;
};

export const limitQuery = (value: unknown): number => {
  if (value === undefined) {
    return 50;
  }
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw badRequest('limit must be between 1 and 100');
  }
  return limit;
};
