import { AppActionResult, AppActionResultError, AppActionResultSuccess } from '../../../types';

export function assertAppActionResultSuccess<T>(
  value: AppActionResult<T>
): asserts value is AppActionResultSuccess<T> {
  if (!('data' in value)) {
    throw new TypeError('`data` missing in value');
  }
}

export function assertAppActionResultFailure<T>(
  value: AppActionResult<T>
): asserts value is AppActionResultError {
  if (!('error' in value)) {
    throw new TypeError('`error` missing in value');
  }
}

export function assertAppActionResult<T>(value: unknown): asserts value is AppActionResult<T> {
  if (!value) {
    throw new TypeError('value undefined or null');
  }
  if (typeof value !== 'object') {
    throw new TypeError('value is not an object');
  }
  if (!('ok' in value)) {
    throw new TypeError('`ok` missing in value');
  }
}
