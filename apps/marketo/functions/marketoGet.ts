import type { MarketoApiResponse } from '../src/types';

export const marketoGet = async <T>(
  baseUrl: string,
  path: string,
  accessToken: string
): Promise<{ response: Response; body: MarketoApiResponse<T> }> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return { response, body: await response.json() };
};

// 606: more than 100 calls in 20 seconds. 615: more than 10 concurrent calls.
// Both clear on their own, so the request is worth retrying after a wait.
const RATE_LIMIT_CODES = new Set(['606', '615']);

export const isRateLimited = (body: MarketoApiResponse<unknown>) =>
  (body.errors ?? []).some((error) => RATE_LIMIT_CODES.has(String(error.code)));
