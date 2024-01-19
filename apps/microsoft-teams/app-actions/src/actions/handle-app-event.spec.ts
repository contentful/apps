import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { AppInstallationProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponseSuccess } from '../types';
import { makeMockAppActionCallContext, mockAppInstallation, mockEntry } from '../../test/mocks';
import { handler } from './handle-app-event';

chai.use(sinonChai);

describe('handle-app-event.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;
  const tenantId = 'test-tenant-id';

  const cmaClientMockResponses: [AppInstallationProps] = [mockAppInstallation];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it.only('returns the ok result', async () => {
    const result = (await handler(
      {
        payload: mockEntry,
        topic: 'ContentManagement.Entry.publish',
        eventDatetime: '2024-01-18T21:43:54.267Z',
      },
      context
    )) as AppActionCallResponseSuccess<boolean>;

    expect(result).to.have.property('ok', true);
    expect(result).to.have.property('data', true);
  });
});
