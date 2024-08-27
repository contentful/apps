import { expect } from 'chai';
import sinon from 'sinon';
import { fetchApiEndpoint } from './fetchApiEndpoint';
import { AppInstallationProps, PlainClientAPI } from 'contentful-management';
import {
  makeMockAppInstallation,
  makeMockPlainClient,
  mockAppInstallationParameters,
} from '../../test/mocks';
import { AppInstallationParameters } from '../types';

describe('fetchApiEndpoint', () => {
  const appInstallationId = 'app-installation-id';
  const appInstallationParameters: AppInstallationParameters = mockAppInstallationParameters;
  const cmaClientMockResponses: [AppInstallationProps] = [
    makeMockAppInstallation(appInstallationParameters),
  ];
  const cmaRequestStub = sinon.stub();
  let cmaClient: PlainClientAPI;

  beforeEach(() => {
    cmaClient = makeMockPlainClient(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns the api endpoint', async () => {
    const result = await fetchApiEndpoint(cmaClient, appInstallationId);
    expect(result).to.eq(appInstallationParameters.apiEndpoint);
  });
});
