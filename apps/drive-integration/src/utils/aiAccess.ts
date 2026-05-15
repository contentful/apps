import { ERROR_MESSAGES } from './constants/messages';

type ErrorLike = {
  code?: string;
  name?: string;
  message?: string;
  details?: {
    reasons?: string | string[];
  };
  status?: number;
  statusCode?: number;
  sys?: {
    id?: string;
  };
};

export class AiAccessDeniedError extends Error {
  readonly cause?: unknown;

  constructor(message: string = ERROR_MESSAGES.AI_ACCESS_DENIED, cause?: unknown) {
    super(message);
    this.name = 'AiAccessDeniedError';
    this.cause = cause;
  }
}

function getErrorLike(error: unknown): ErrorLike | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  return error as ErrorLike;
}

function getReasons(error: ErrorLike): string | null {
  const reasons = error.details?.reasons;
  if (typeof reasons === 'string' && reasons.trim().length > 0) {
    return reasons;
  }

  if (Array.isArray(reasons) && reasons.length > 0) {
    return reasons.join(', ');
  }

  return null;
}

export function isAiAccessDeniedError(error: unknown): error is AiAccessDeniedError {
  if (error instanceof AiAccessDeniedError) {
    return true;
  }

  const err = getErrorLike(error);
  if (!err) {
    return false;
  }

  const hasForbiddenStatus = err.status === 403;
  const hasAccessDeniedIdentifier = err.sys?.id === 'AccessDenied';

  return hasForbiddenStatus && hasAccessDeniedIdentifier;
}

export function normalizeAiAccessError(error: unknown): Error {
  if (error instanceof AiAccessDeniedError) {
    return error;
  }

  if (isAiAccessDeniedError(error)) {
    const err = getErrorLike(error);
    return new AiAccessDeniedError(getReasons(err ?? {}) ?? ERROR_MESSAGES.AI_ACCESS_DENIED, error);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown error');
}
