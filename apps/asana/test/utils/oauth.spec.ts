import { describe, expect, it } from 'vitest';
import { generateOAuthState, generatePkcePair, getOAuthRedirectUri } from '../../src/utils/oauth';

describe('oauth utils', () => {
  it('generateOAuthState returns unique non-empty values', () => {
    const first = generateOAuthState();
    const second = generateOAuthState();

    expect(first.length).toBeGreaterThan(0);
    expect(first).not.toEqual(second);
  });

  it('generatePkcePair derives a distinct code_challenge from the code_verifier', async () => {
    const { codeVerifier, codeChallenge } = await generatePkcePair();

    expect(codeVerifier.length).toBeGreaterThan(0);
    expect(codeChallenge.length).toBeGreaterThan(0);
    expect(codeChallenge).not.toEqual(codeVerifier);
  });

  it('getOAuthRedirectUri builds a URL from the current origin, pathname, and the callback flag', () => {
    expect(getOAuthRedirectUri()).toEqual(
      `${window.location.origin}${window.location.pathname}?oauthCallback=1`
    );
  });
});
