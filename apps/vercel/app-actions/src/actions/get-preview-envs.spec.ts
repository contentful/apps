import { expect } from 'chai';
import sinon from 'sinon';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { handler } from './get-preview-envs';
import { AppActionCallResponseSuccess, ContentPreviewEnvironment } from '../types';

describe('get-preview-env.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  const callParameters = {
    contentTypeId: 'contentTypeId',
  };

  const cmaClientMockResponses: [AppInstallationProps] = [
    {
      sys: {
        type: 'AppInstallation',
        appDefinition: {} as SysLink,
        environment: {} as SysLink,
        space: {} as SysLink,
        version: 1,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      parameters: {
        apiKey: 'openai-api-key',
      },
    },
  ];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns a list of preview environments', async () => {
    const result = await handler(callParameters, context);
    expect(result).to.have.property('ok', true);

    const contentPreviewEnvironments = (
      result as AppActionCallResponseSuccess<ContentPreviewEnvironment[]>
    ).data;
    expect(contentPreviewEnvironments[0]).to.have.property(
      'envId',
      'vercel-app-preview-environment'
    );
  });
});
