import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  Adapter,
  AppInstallationProps,
  PlainClientAPI,
  SysLink,
  createClient,
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

export const mockSapProductList = {
  products: [
    {
      code: 'MZ-FG-AS-H100',
      configurable: false,
      configuratorType: '',
      description:
        'Bell Helmets Drifter MIPS. Helmet style: Mountain bike helmet, Construction type: In-mold, Recommended gender: Man/Woman. Weight: 9.95 oz (282 g)',
      firstVariantImage:
        '/medias/MZ-FG-AS-H100-96Wx96H.png?context=bWFzdGVyfGltYWdlc3w5MjgxfGltYWdlL3BuZ3xhR0U1TDJnNE5pODROemszT1RjNE5qVTJOems0TDAxYUxVWkhMVUZUTFVneE1EQXRPVFpYZURrMlNDNXdibWN8NThkOTlhYmI3ODEzMzMyMjQ2OTQ3OTM3ZGJmMzhmY2U0MDYwZDZlZmU5YzBkOGUwMTkyZTA0NWNmNmU0YzMyYg',
      manufacturer: 'B2BBestrun Bicycles',
      multidimensional: false,
      name: 'Mountain bike helmet',
      priceRange: {},
      summary:
        'Bell Helmets Drifter MIPS, Mountain bike helmet, In-mold, Man/Woman, 2018-S, 9.95 oz (282 g)',
      url: '/Open-Catalogue/Bicycles/Safety/Mountain-bike-helmet/p/MZ-FG-AS-H100',
      volumePricesFlag: false,
    },
    {
      code: 'MZ-FG-E101',
      configurable: false,
      configuratorType: '',
      description:
        'With over 50km of battery assisted range, B2BBestrun Pro will go wherever your ride takes you. The high energy density of this Lithium Polymer cell ensures maximum travel time.',
      firstVariantImage:
        '/medias/MZ-FG-E101-96Wx96H.jpg?context=bWFzdGVyfGltYWdlc3w0MjA2fGltYWdlL2pwZWd8YURneUwyZ3hNaTg0TnprM09UYzVPVFkzTlRFNEwwMWFMVVpITFVVeE1ERXRPVFpYZURrMlNDNXFjR2N8NDcwYTM0MzkxYjVkNjFlMDI1MjExYWI5ZWFiMjZiZGNjNTIzODFiMmJjMjcyZjk2MzE4MmIwNDc0ZGEzYzg5Zg',
      manufacturer: 'B2BBestrun Bicycles',
      multidimensional: false,
      name: 'Pro',
      priceRange: {},
      summary: 'Long ride? Meet your ultimate travel companion.',
      url: '/Open-Catalogue/Bicycles/Cruise-Bikes/Pro/p/MZ-FG-E101',
      volumePricesFlag: false,
    },
    {
      code: 'MZ-TG-AT-R100',
      configurable: false,
      configuratorType: '',
      description:
        '- Easy: Measure and refill sealant through the rubber flaps without deflating the tire<br>- Reliable: Rubber flaps prevents sealant from filling and blocking the valves<br> - Clean: Install tire dry – add sealant later. No more mess',
      firstVariantImage:
        '/medias/MZ-TG-AT-R100-96Wx96H.jpg?context=bWFzdGVyfGltYWdlc3wxNTA1ODN8aW1hZ2UvanBlZ3xhR0l3TDJnNVlTODROemszT1RjNE1EazVOelF5TDAxYUxWUkhMVUZVTFZJeE1EQXRPVFpYZURrMlNDNXFjR2N8YzVjZDliNjVhODliMzA3N2ZjYzU2NzAzYTYyOTgzMTIxYTRkNTgwZGNmNjI4YTA5MThiMjQxNWQ0YzA4YzM0Yg',
      manufacturer: 'B2BBestrun Bicycles',
      multidimensional: false,
      name: 'Deluxe tire repair/inflation kit',
      priceRange: {},
      summary:
        'The kit consists of two valves, a valve core tool and a measuring and refilling syringe. All parts can be clipped into the plunger of the syringe, providing a compact and clean way to store the kit.',
      url: '/Open-Catalogue/Bicycles/Tools/Deluxe-tire-repair-inflation-kit/p/MZ-TG-AT-R100',
      volumePricesFlag: false,
    },
  ],
  pagination: {},
};
