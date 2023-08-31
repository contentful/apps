import { expect } from 'chai';
import sinon from 'sinon';
import { handler } from './aiig-static';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';

describe('aiigBuildAction.handler', () => {
  const parameters = {
    prompt: 'My image text',
    image: 'http://www.exampl.com',
    mask: 'http://www.example.com',
  };
  const cmaRequestStub = sinon.stub();
  const mockAppInstallation: AppInstallationProps = {
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
  };
  const context = makeMockAppActionCallContext(mockAppInstallation, cmaRequestStub);

  it('returns the images result', async () => {
    const result = await handler(parameters, context);
    expect(result).to.have.property('ok', true);
  });
});
