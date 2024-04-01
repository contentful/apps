import { expect } from 'chai';
import { constructVercelPreviewUrlParts } from './construct-vercel-preview-url-parts';
import { mockVercelProject } from '../../test/mocks';

describe('constructVercelPreviewUrlParts', () => {
  const vercelProject = mockVercelProject;

  it('returns the parts of the URL', async () => {
    const result = constructVercelPreviewUrlParts(vercelProject);
    expect(result.origin).to.include('https://');
    expect(result.xVercelProtectionBypass).to.eql('ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7');
  });
});
