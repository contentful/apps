import { assert } from '../../../test/utils';
import { bootstrap } from '../../app';

// AIS-297 / AIS-299 regression: the Contentful request-verification middleware
// was mounted on the bare string 'api/tokens' (no leading slash). Express 4
// compiles mount paths with path-to-regexp@0.1.x, which produces a regexp that
// does NOT match an incoming '/api/tokens' path — so the only auth step on the
// OAuth credentials endpoint was silently skipped.
//
// This test inspects the *compiled* Express router stack, so it exercises the
// real failure mechanism (path-to-regexp matching) rather than the source text.
describe('request-verification middleware mount', () => {
  // The guard is mounted via app.use([<paths>], createContentfulRequestVerification...).
  // In the compiled router stack it is the path-scoped middleware layer that
  // matches '/api/messages' but is NOT a catch-all (does not match '/') and is
  // not a terminal route ('bound dispatch'). That uniquely identifies it: the
  // only other layers matching '/api/messages' are catch-alls (cors, json, the
  // serverless middleware, error handler) which all also match '/'.
  const guardRegExp = (): RegExp => {
    const stack = (bootstrap() as unknown as { _router: { stack: { name: string; regexp: RegExp }[] } })
      ._router.stack;
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
    assert.isFalse(regexp.test('/api/slack-events'), 'must not guard the public Slack events route');
    assert.isFalse(regexp.test('/api/oauth'), 'must not guard the public OAuth redirect route');
  });
});
