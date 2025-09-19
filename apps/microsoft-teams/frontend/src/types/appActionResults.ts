import { AppActionError, Channel } from '../../../types';

// Types that match the backend app action result schemas

export interface ListChannelsSuccess {
  ok: true;
  data: Channel[];
}

export interface ListChannelsError {
  ok: false;
  error: AppActionError;
}

export type ListChannelsResult = ListChannelsSuccess | ListChannelsError;

export interface SendTestMessageSuccess {
  ok: true;
  data: {
    messageResponseId: string;
  };
}

export interface SendTestMessageError {
  ok: false;
  error: AppActionError;
}

export type SendTestMessageResult = SendTestMessageSuccess | SendTestMessageError;

// Assertion functions for runtime validation
// List Channels
export function assertIsListChannelsResult(value: unknown): asserts value is ListChannelsResult {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Expected ListChannelsResult to be an object, but received null or non-object');
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.ok !== 'boolean') {
    console.dir(obj, { depth: null });
    throw new Error(`Expected ListChannelsResult.ok to be boolean, but received ${typeof obj.ok}`);
  }

  if (obj.ok === true) {
    if (!Array.isArray(obj.data)) {
      throw new Error(
        `Expected ListChannelsResult.data to be an array when ok=true, but received ${typeof obj.data}`
      );
    }
    if (obj.error !== undefined) {
      throw new Error(
        'Expected ListChannelsResult.error to be undefined when ok=true, but error was present'
      );
    }
  } else {
    if (obj.data !== undefined) {
      throw new Error(
        'Expected ListChannelsResult.data to be undefined when ok=false, but data was present'
      );
    }
    if (obj.error === undefined) {
      throw new Error(
        'Expected ListChannelsResult.error to be defined when ok=false, but error was undefined'
      );
    }
  }
}

export function assertIsListChannelsSuccess(value: unknown): boolean {
  assertIsListChannelsResult(value);
  if (!value.ok) {
    return false;
  }
  return value.ok == true;
}

export function assertIsListChannelsError(value: unknown): boolean {
  assertIsListChannelsResult(value);
  if (value.ok) {
    return false;
  }
  return value.ok == false;
}

// Send Test Message
export function assertIsSendTestMessageResult(
  value: unknown
): asserts value is SendTestMessageResult {
  if (typeof value !== 'object' || value === null) {
    throw new Error(
      'Expected SendTestMessageResult to be an object, but received null or non-object'
    );
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.ok !== 'boolean') {
    throw new Error(
      `Expected SendTestMessageResult.ok to be boolean, but received ${typeof obj.ok}`
    );
  }

  if (obj.ok === true) {
    if (obj.data === undefined || typeof obj.data !== 'object' || obj.data === null) {
      throw new Error(
        `Expected SendTestMessageResult.data to be an object when ok=true, but received ${typeof obj.data}`
      );
    }

    const dataObj = obj.data as Record<string, unknown>;
    if (typeof dataObj.messageResponseId !== 'string') {
      throw new Error(
        `Expected SendTestMessageResult.data.messageResponseId to be string, but received ${typeof dataObj.messageResponseId}`
      );
    }

    if (obj.error !== undefined) {
      throw new Error(
        'Expected SendTestMessageResult.error to be undefined when ok=true, but error was present'
      );
    }
  } else {
    if (obj.data !== undefined) {
      throw new Error(
        'Expected SendTestMessageResult.data to be undefined when ok=false, but data was present'
      );
    }
    if (obj.error === undefined) {
      throw new Error(
        'Expected SendTestMessageResult.error to be defined when ok=false, but error was undefined'
      );
    }
  }
}

export function assertIsSendTestMessageSuccess(value: unknown): boolean {
  assertIsSendTestMessageResult(value);
  if (!value.ok) {
    throw new Error('Expected SendTestMessageSuccess but received SendTestMessageError');
  }
  return value.ok == true;
}

export function assertIsSendTestMessageError(value: unknown): boolean {
  assertIsSendTestMessageResult(value);
  if (value.ok) {
    throw new Error('Expected SendTestMessageError but received SendTestMessageSuccess');
  }
  return value.ok == false;
}
