import { expect } from 'chai';
import sinon from 'sinon';
import {
  makeMockAppActionCallContext,
  makeMockAppInstallation,
  makeMockFetchResponse,
  mockSapProductList,
} from '../../test/mocks';
import { AppInstallationProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { handler } from './fetchProductList';
import { AppActionCallResponseSuccess } from '../types';

describe('fetchProductList.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;
  const cmaClientMockResponses: [AppInstallationProps] = [makeMockAppInstallation()];
  let stubbedFetch: sinon.SinonStub;

  beforeEach(() => {
    const mockFetchResponse = makeMockFetchResponse(mockSapProductList);
    stubbedFetch = sinon.stub(global, 'fetch');
    stubbedFetch.resolves(mockFetchResponse);
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  afterEach(async () => {
    stubbedFetch.restore();
  });

  it('returns the product list result', async () => {
    const result = await handler(
      {
        baseSite: 'powertools-spa',
        searchQuery: '',
        page: 0,
      },
      context
    );
    expect(result).to.have.property('ok', true);
    const productList = (result as AppActionCallResponseSuccess<string[]>).data;
    expect(productList).to.be.an('array');
    expect(productList).to.have.length(3);
  });
});
