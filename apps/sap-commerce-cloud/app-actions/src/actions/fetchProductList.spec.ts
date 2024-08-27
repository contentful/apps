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
import { AppActionCallResponseSuccess, Product } from '../types';

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
    const productResponse = (
      result as AppActionCallResponseSuccess<{ products: Product[]; pagination: unknown }>
    ).data;
    expect(productResponse.products).to.be.an('array');
    expect(productResponse.products).to.have.length(3);
  });
});
