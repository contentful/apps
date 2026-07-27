import { assert } from '../../test/utils';

// AIS-297 / AIS-299 regression: 'api/tokens' (no leading slash) was silently
// skipped by path-to-regexp, leaving POST /api/tokens unauthenticated.
// This test locks the path list so the guard always includes /api/tokens.
describe('request-verification middleware path list', () => {
  it('includes /api/tokens with a leading slash', async () => {
    // Dynamically require app.ts source text and assert the correct path string.
    // We cannot call bootstrap() directly (it creates live AWS clients), so we
    // read the registered path list from the module source instead.
    const fs = await import('fs');
    const path = await import('path');

    const appSource = fs.readFileSync(
      path.resolve(__dirname, '../../app.ts'),
      'utf-8'
    );

    // The guard is mounted via: app.use([...paths], createContentfulRequestVerificationMiddleware(...))
    // Extract the string array passed to that call.
    const guardCallMatch = appSource.match(
      /createContentfulRequestVerificationMiddleware\([\s\S]*?\)/
    );
    assert.ok(guardCallMatch, 'createContentfulRequestVerificationMiddleware call not found in app.ts');

    // Find the array literal that precedes the call on the same app.use(...) invocation.
    const useBlockMatch = appSource.match(
      /app\.use\(\s*(\[[\s\S]*?\])\s*,\s*createContentfulRequestVerificationMiddleware/
    );
    assert.ok(useBlockMatch, 'app.use path array for request-verification middleware not found');

    const pathArray: string[] = JSON.parse(useBlockMatch![1].replace(/'/g, '"').replace(/\s/g, ''));

    assert.include(pathArray, '/api/tokens', 'Guard must protect /api/tokens (with leading slash)');
    assert.notInclude(pathArray, 'api/tokens', 'Guard must NOT use bare api/tokens (missing slash bypasses path-to-regexp)');
  });
});
