import { expect } from 'chai';
import sinon from 'sinon';
import { makeMockAppInstallation, makeMockPlainClient } from '../../test/mocks';
import { AppInstallationProps, PlainClientAPI } from 'contentful-management';
import { buildPreviewUrlsForContentTypes } from './build-preview-urls-for-content-types';

describe('buildPreviewUrlsForContentTypes', () => {
  const context = {
    spaceId: 'space-id',
    environmentId: 'environment-id',
    appInstallationId: 'app-installation-id',
  };
  const cmaClientMockResponses: [AppInstallationProps] = [makeMockAppInstallation()];
  const cmaRequestStub = sinon.stub();
  const cmaClient = makeMockPlainClient(cmaClientMockResponses, cmaRequestStub);

  it('returns a mapping of preview URls by content type', async () => {
    const result = await buildPreviewUrlsForContentTypes(context, cmaClient);
    expect(result['blog']).to.eql(
      'https://team-integrations-vercel-playground-master.vercel.app/api/enable-draft?path=%2Fblogs%2F%7Bentry.fields.slug%7D&x-vercel-protection-bypass=ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7'
    );
  });
});
