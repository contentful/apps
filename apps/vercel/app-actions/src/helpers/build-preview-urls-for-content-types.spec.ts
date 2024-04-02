import { expect } from 'chai';
import { mockAppInstallationParameters, mockVercelProject } from '../../test/mocks';
import { buildPreviewUrlsForContentTypes } from './build-preview-urls-for-content-types';

describe('buildPreviewUrlsForContentTypes', () => {
  const vercelProject = mockVercelProject;
  const contentTypePreviewPaths = mockAppInstallationParameters.contentTypePreviewPathSelections;

  it('returns a mapping of preview URls by content type', async () => {
    const result = buildPreviewUrlsForContentTypes(vercelProject, contentTypePreviewPaths);
    expect(result['blog']).to.eql(
      'https://team-integrations-vercel-playground-gqmys2z3c.vercel.app/api/enable-draft?path=%2Fblogs%2F%7Bentry.fields.slug%7D&x-vercel-protection-bypass=ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7'
    );
  });
});
