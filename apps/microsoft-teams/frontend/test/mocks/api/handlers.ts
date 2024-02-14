import { HttpResponse, http } from 'msw';
import { graphConfig } from '@configs/authConfig';

const mockBrandingResponse = {
  '@odata.context': 'test-string',
  cdnList: ['images.example'],
  faviconRelativeUrl: 'favicon',
  squareLogoRelativeUrl: 'square',
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
