import { expect } from 'chai';
import sinon from 'sinon';
import {
  makeMockAppActionCallContext,
  makeMockAppInstallation,
  makeMockFetchRejection,
  makeMockFetchResponse,
  mockSapProductPreview,
  mockSapProductPreviewRejection,
} from '../../test/mocks';
import { AppInstallationProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { handler } from './fetchProductPreview';
import { AppActionCallResponseSuccess, Product } from '../types';

describe('fetchProductPreview.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;
  const cmaClientMockResponses: [AppInstallationProps] = [makeMockAppInstallation()];
  let stubbedFetch: sinon.SinonStub;

  beforeEach(() => {});

  afterEach(async () => {
    stubbedFetch.restore();
  });

  it('returns product preview', async () => {
    const mockFetchResponse = makeMockFetchResponse(mockSapProductPreview);
    stubbedFetch = sinon.stub(global, 'fetch');
    stubbedFetch.resolves(mockFetchResponse);
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);

    const skus =
      '["https://api.cm77gs48zv-contentfu1-d1-public.model-t.cc.commerce.ondemand.com/occ/v2/powertools-spa/products/MZ-FG-E101"]';
    const result = await handler({ skus }, context);
    expect(result).to.have.property('ok', true);
    const productPreviews = (result as AppActionCallResponseSuccess<Product[]>).data;
    expect(productPreviews[0].sku).to.equal('MZ-FG-E101');
  });

  it('handles when a product could not be found', async () => {
    const mockFetchResponse = makeMockFetchRejection(mockSapProductPreviewRejection);
    stubbedFetch = sinon.stub(global, 'fetch');
    stubbedFetch.resolves(mockFetchResponse);
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);

    const skus =
      '["https://api.cm77gs48zv-contentfu1-d1-public.model-t.cc.commerce.ondemand.com/occ/v2/powertools-spa/products/MZ-FG-E101"]';
    const result = await handler({ skus }, context);
    expect(result).to.have.property('ok', true);
    const response = result as AppActionCallResponseSuccess<Product[]>;

    expect(response.data.length).to.equal(1);
    expect(response.data[0].isMissing).to.equal(true);
  });
});
