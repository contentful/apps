import { AppActionResult } from '../../../types';

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
