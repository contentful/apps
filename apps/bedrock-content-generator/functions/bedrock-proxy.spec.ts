/**
 * Unit tests for SigV4 signing in bedrock-proxy.
 *
 * RED on old code: the credential scope contained `/bedrock-runtime/aws4_request`,
 * causing AWS to reject every request with InvalidSignatureException.
 * GREEN on fixed code: the scope uses `/bedrock/aws4_request` (the correct AWS
 * signing service name for Amazon Bedrock).
 */
import { describe, expect, it } from 'vitest';
import { buildCredentialScope, getSigningKey } from './bedrock-proxy';

describe('bedrock-proxy SigV4 signing', () => {
  describe('buildCredentialScope', () => {
    it('uses "bedrock" (not "bedrock-runtime") as the signing service name', () => {
      const scope = buildCredentialScope('20260802', 'us-east-1');
      expect(scope).toBe('20260802/us-east-1/bedrock/aws4_request');
    });

    it('does NOT contain the old wrong service name "bedrock-runtime"', () => {
      const scope = buildCredentialScope('20260802', 'us-west-2');
      expect(scope).not.toContain('bedrock-runtime');
    });

    it('incorporates the dateStamp and region correctly', () => {
      const scope = buildCredentialScope('20251231', 'eu-central-1');
      expect(scope).toBe('20251231/eu-central-1/bedrock/aws4_request');
    });
  });

  describe('getSigningKey', () => {
    it('produces different signing keys for "bedrock" vs "bedrock-runtime"', async () => {
      const dateStamp = '20260802';
      const region = 'us-east-1';
      const secretKey = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';

      const keyBedrock = await getSigningKey(secretKey, dateStamp, region, 'bedrock');
      const keyBedrockRuntime = await getSigningKey(secretKey, dateStamp, region, 'bedrock-runtime');

      // Outputs must differ — the wrong service name produces an invalid key
      const toHex = (buf: ArrayBuffer) =>
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

      expect(toHex(keyBedrock)).not.toBe(toHex(keyBedrockRuntime));
    });
  });
});
