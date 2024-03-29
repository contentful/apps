import { expect } from 'chai';
import sinon from 'sinon';
import { fetchAppInstallationParameters } from './fetch-app-installation-parameters';
import { AppInstallationProps, PlainClientAPI } from 'contentful-management';
import {
  makeMockAppInstallation,
  makeMockPlainClient,
  mockAppInstallationParameters,
} from '../../test/mocks';
import { AppInstallationParameters } from '../types';

describe('fetchAppInstallationParameters', () => {
  const context = {
    spaceId: 'space-id',
    environmentId: 'environment-id',
    appInstallationId: 'app-installation-id',
  };
  const appInstallationParameters: AppInstallationParameters = mockAppInstallationParameters;
  const cmaClientMockResponses: [AppInstallationProps] = [
    makeMockAppInstallation(appInstallationParameters),
  ];
  const cmaRequestStub = sinon.stub();
  let cmaClient: PlainClientAPI;

  beforeEach(() => {
    cmaClient = makeMockPlainClient(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns the app installation parameters', async () => {
    const result = await fetchAppInstallationParameters(context, cmaClient);
    expect(result).to.eq(appInstallationParameters);
  });

  describe('when required params missing', () => {
    const cmaClientMockResponseWithMissingParams: [AppInstallationProps] = [
      makeMockAppInstallation({
        vercelAccessToken: 'vercel-access-token',
      } as AppInstallationParameters),
    ];

    beforeEach(() => {
      cmaClient = makeMockPlainClient(cmaClientMockResponseWithMissingParams, cmaRequestStub);
    });

    it('throws a TypeError', async () => {
      try {
        async () => await fetchAppInstallationParameters(context, cmaClient);
      } catch (error) {
        const e = error as Error;
        expect(e).to.be.a('TypeError');
      }
    });
  });
});
