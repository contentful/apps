import { expect } from 'chai';
import sinon from 'sinon';
import {
  makeMockAppActionCallContext,
  makeMockAppInstallation,
  makeMockFetchResponse,
  mockSapBaseSites,
} from '../../test/mocks';
import { AppInstallationProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { handler } from './fetchBaseSites';
import { AppActionCallResponseSuccess } from '../types';

describe('fetchBaseSites.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;
  const cmaClientMockResponses: [AppInstallationProps] = [makeMockAppInstallation()];
  let stubbedFetch: sinon.SinonStub;

  beforeEach(() => {
    const mockFetchResponse = makeMockFetchResponse(mockSapBaseSites);
    stubbedFetch = sinon.stub(global, 'fetch');
    stubbedFetch.resolves(mockFetchResponse);
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns the base sites result', async () => {
    const result = await handler({}, context);
    expect(result).to.have.property('ok', true);
    const baseSites = (result as AppActionCallResponseSuccess<string[]>).data;
    expect(baseSites[0]).to.equal('powertools-spa');
  });
});
