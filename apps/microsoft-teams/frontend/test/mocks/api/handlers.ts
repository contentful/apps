import { HttpResponse, http } from 'msw';
import { graphConfig } from '@configs/authConfig';

const mockBrandingResponse = {
  '@odata.context': 'test-string',
  cdnList: ['images.example'],
  faviconRelativeUrl: 'favicon',
  squareLogoRelativeUrl: 'square',
};

const invalidTokenResponse = {
  error: {
    code: 'InvalidAuthenticationToken',
    message: 'Lifetime validation failed, the token is expired.',
  },
};

const resourceNotFoundResponse = {
  error: {
    code: 'Request_ResourceNotFound',
    message:
      "Resource 'mock-tenant' does not exist or one of its queried reference-property objects are not present.",
  },
};

export const handlers = [
  http.get(`${graphConfig.graphOrgEndpoint}:tenantId`, () => {
    return HttpResponse.json({ displayName: 'Company ABC' }, { status: 200 });
  }),

  http.get(`${graphConfig.graphOrgEndpoint}:tenantId/branding`, () => {
    return HttpResponse.json(mockBrandingResponse, { status: 200 });
  }),
];

export const noSquareLogoHandler = [
  http.get(`${graphConfig.graphOrgEndpoint}:tenantId/branding`, () => {
    return HttpResponse.json(
      { ...mockBrandingResponse, squareLogoRelativeUrl: '' },
      { status: 200 }
    );
  }),
];

export const noLogosHandler = [
  http.get(`${graphConfig.graphOrgEndpoint}:tenantId/branding`, () => {
    return HttpResponse.json(
      { ...mockBrandingResponse, squareLogoRelativeUrl: null, faviconRelativeUrl: null },
      { status: 200 }
    );
  }),
];

export const errorHandlers = [
  http.get(`${graphConfig.graphOrgEndpoint}:tenantId`, () => {
    return HttpResponse.json(invalidTokenResponse, { status: 401 });
  }),

  http.get(`${graphConfig.graphOrgEndpoint}:tenantId/branding`, () => {
    return HttpResponse.json(resourceNotFoundResponse, { status: 404 });
  }),
];
