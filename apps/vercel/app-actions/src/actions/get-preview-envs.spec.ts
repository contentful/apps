import { expect } from 'chai';
import sinon from 'sinon';
import { makeMockAppActionCallContext, makeMockAppInstallation } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { handler } from './get-preview-envs';
import { AppActionCallResponseSuccess, ContentPreviewEnvironment } from '../types';

describe('get-preview-env.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  const callParameters = {};

  const cmaClientMockResponses: [AppInstallationProps] = [makeMockAppInstallation()];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns a list of preview environments', async () => {
    const result = await handler(callParameters, context);
    console.log({ result });
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
