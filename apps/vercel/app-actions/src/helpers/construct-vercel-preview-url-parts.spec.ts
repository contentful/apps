import { expect } from 'chai';
import sinon from 'sinon';
import { constructVercelPreviewUrlParts } from './construct-vercel-preview-url-parts';

describe('constructVercelPreviewUrlParts', () => {
  const vercelAccessToken = 'vercel-access-token';
  const vercelProjectId = 'vercel-project-id';

  it('returns the parts of the URL', async () => {
    const result = await constructVercelPreviewUrlParts(vercelAccessToken, vercelProjectId);
    expect(result.origin).to.include('https://');
    expect(result.xVercelProtectionBypass).to.be.a('string');
  });
});
