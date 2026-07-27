import { assert } from '../../../test/utils';
import { bootstrap } from '../../app';

describe('request-verification middleware mount', () => {
  const guardRegExp = (): RegExp => {
    const stack = (
      bootstrap() as unknown as { _router: { stack: { name: string; regexp: RegExp }[] } }
    )._router.stack;
    const layer = stack.find(
      (l) => l.name !== 'bound dispatch' && l.regexp?.test('/api/messages') && !l.regexp.test('/')
    );
    if (!layer) {
      throw new Error('request-verification middleware mount layer not found in router stack');
    }
    return layer.regexp;
  };

  it('guards POST /api/tokens (path-to-regexp actually matches it)', () => {
    assert.isTrue(
      guardRegExp().test('/api/tokens'),
      'verification middleware must match /api/tokens — a bare "api/tokens" mount silently bypasses it'
    );
  });

  it('still guards the other protected routes', () => {
    const regexp = guardRegExp();
    assert.isTrue(regexp.test('/api/messages'), 'must guard /api/messages');
    assert.isTrue(regexp.test('/api/events'), 'must guard /api/events');
    assert.isTrue(regexp.test('/api/spaces/anything'), 'must guard /api/spaces/*');
  });

  it('does not over-match unrelated routes', () => {
    const regexp = guardRegExp();
    assert.isFalse(
      regexp.test('/api/slack-events'),
      'must not guard the public Slack events route'
    );
    assert.isFalse(regexp.test('/api/oauth'), 'must not guard the public OAuth redirect route');
  });
});
