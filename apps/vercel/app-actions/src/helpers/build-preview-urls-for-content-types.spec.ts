import { expect } from 'chai';
import { mockAppInstallationParameters, mockVercelProject } from '../../test/mocks';
import { buildPreviewUrlsForContentTypes } from './build-preview-urls-for-content-types';

describe('buildPreviewUrlsForContentTypes', () => {
  const vercelProject = mockVercelProject;
  const contentTypePreviewPaths = mockAppInstallationParameters.contentTypePreviewPathSelections;
  const apiPath = mockAppInstallationParameters.selectedApiPath;

  it('returns a mapping of preview URls by content type', async () => {
    const result = buildPreviewUrlsForContentTypes(vercelProject, contentTypePreviewPaths, apiPath);
    expect(result['blog']).to.eql(
      'https://team-integrations-vercel-playground-gqmys2z3c.vercel.app/api/enable-draft?x-vercel-protection-bypass=ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7&path=%2Fblogs%2F{entry.fields.slug}'
    );
  });

  describe('when a contenTypePreviewPath previewPath is empty', () => {
    const contentTypePreviewPathsWithEmpty = [
      ...contentTypePreviewPaths,
      { contentType: 'articles', previewPath: ' ' },
    ];

    it('does not include the empty path', async () => {
      const result = buildPreviewUrlsForContentTypes(
        vercelProject,
        contentTypePreviewPathsWithEmpty,
        apiPath
      );
      expect(result['articles']).to.be.undefined;
    });
  });
});
