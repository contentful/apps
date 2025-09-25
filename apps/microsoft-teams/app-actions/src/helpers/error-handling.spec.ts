import { expect } from 'chai';
import { withAsyncAppActionErrorHandling } from './error-handling';
import { AppActionResult } from '../../../types';

describe('withAsyncAppActionErrorHandling', () => {
  const testHandler = async (arg: string): Promise<AppActionResult<string>> => {
    return { ok: true, data: arg };
  };

  it('returns a function that continues to work as normal with no errors', async () => {
    const newFunc = withAsyncAppActionErrorHandling(testHandler);
    const result = await newFunc('hello');
    expect(result).to.deep.equal({ ok: true, data: 'hello' });
  });

  describe('when handler throws an error', () => {
    const testHandler = async (_arg: string): Promise<AppActionResult<string>> => {
      throw new TypeError('boom!');
    };

    it('returns a function that returns an error result without throwing', async () => {
      const newFunc = withAsyncAppActionErrorHandling(testHandler);
      const result = await newFunc('hello');
      expect(result).to.deep.equal({ ok: false, error: { message: 'boom!', type: 'TypeError' } });
    });
  });
});
