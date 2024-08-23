import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  Adapter,
  PlainClientAPI,
  createClient,
  AppInstallationProps,
  SysLink,
} from 'contentful-management';
import sinon from 'sinon';
import { AppInstallationParameters, BaseSites } from '../src/types';

export const makeMockPlainClient = (responses: any[], stub: sinon.SinonStub): PlainClientAPI => {
  for (const [callNumber, response] of responses.entries()) {
    stub.onCall(callNumber).returns(response);
  }
  const apiAdapter: Adapter = {
    makeRequest: async <T>(args: T) => {
      return stub(args);
    },
  };
  return createClient({ apiAdapter }, { type: 'plain' });
};

export const makeMockFetchResponse = (
  body: object,
  headers: Record<string, string> = {}
): Response => {
  const responseBody = JSON.stringify(body);
  return new Response(responseBody, { headers });
};
export const makeMockFetchRejection = (
  body: object,
  headers: Record<string, string> = {}
): Response => {
  const responseBody = JSON.stringify(body);
  return new Response(responseBody, { headers, status: 400 });
};

export const makeMockAppActionCallContext = (
  responses: any[],
  cmaStub = sinon.stub()
): AppActionCallContext => {
  return {
    cma: makeMockPlainClient(responses, cmaStub),
    appActionCallContext: {
      spaceId: 'space-id',
      environmentId: 'environment-id',
      appInstallationId: 'app-installation-id',
      userId: 'user-id',
      cmaHost: 'api.contentful.com',
      uploadHost: 'upload.contentful.com',
    },
  };
};

export const mockAppInstallationParameters: AppInstallationParameters = {
  apiEndpoint: 'sap-endpoint',
  baseSites: 'electronics-spa',
};

export const makeMockAppInstallation = (
  parameters = mockAppInstallationParameters
): AppInstallationProps => ({
  sys: {
    type: 'AppInstallation',
    appDefinition: {} as SysLink,
    environment: {} as SysLink,
    space: {} as SysLink,
    version: 1,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  parameters,
});

export const mockSapBaseSites: BaseSites = {
  baseSites: [
    {
      channel: 'B2B',
      defaultLanguage: {
        active: true,
        isocode: 'en',
        name: 'English',
        nativeName: 'English',
      },
      isolated: false,
      name: 'Bestrun B2B Site',
      theme: 'santorini',
      uid: 'powertools-spa',
    },
    {
      channel: 'B2C',
      defaultLanguage: {
        active: true,
        isocode: 'en',
        name: 'English',
        nativeName: 'English',
      },
      isolated: false,
      name: 'Bestrun B2C Site',
      theme: 'santorini',
      uid: 'electronics-spa',
    },
    {
      isolated: false,
      uid: 'test-site',
    },
  ],
};

export const mockSapProductPreview = {
  availableForPickup: false,
  categories: [],
  code: 'MZ-FG-E101',
  configurable: false,
  description:
    'With over 50km of battery assisted range, B2BBestrun Pro will go wherever your ride takes you. The high energy density of this Lithium Polymer cell ensures maximum travel time.',
  images: [
    [
      { url: 'https://www.b2bbestrun.com/image1.jpg' },
      { url: 'https://www.b2bbestrun.com/image2.jpg' },
    ],
  ],
  manufacturer: 'B2BBestrun Bicycles',
  multidimensional: false,
  name: 'Pro',
  numberOfReviews: 0,
  price: {
    currencyIso: 'USD',
    formattedValue: '$1,349.00',
    priceType: 'BUY',
    value: 1349,
  },
  priceRange: {},
  stock: {
    isValueRounded: false,
    stockLevel: 308,
    stockLevelStatus: 'inStock',
  },
  summary: 'Long ride? Meet your ultimate travel companion.',
  url: '/Open-Catalogue/Bicycles/Cruise-Bikes/Pro/p/MZ-FG-E101',
};

export const mockSapProductPreviewRejection = {
  errors: [
    {
      message: "Product with code 'CONF_BLAH' not found!",
      type: 'UnknownIdentifierError',
    },
  ],
};
