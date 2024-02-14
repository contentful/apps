import { server } from './mocks/api/server';
import { afterAll, afterEach, beforeAll } from 'vitest';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
