import { expect } from 'chai';
import sinon from 'sinon';
import { handler } from './aiig-static';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';

describe('aiigBuildAction.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  const parameters = {
    prompt: 'My image text',
    image: 'http://www.exampl.com',
    mask: 'http://www.example.com',
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

  it('returns the images result', async () => {
    const result = await handler(parameters, context);
    expect(result).to.have.property('ok', true);
  });
});
