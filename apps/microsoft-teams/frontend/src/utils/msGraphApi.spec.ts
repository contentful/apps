import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { describe, expect, it } from 'vitest';
import MsGraph from './msGraphApi';
import { mockMsalWithAccounts } from '@test/mocks';
import { server } from '@test/mocks/api/server';
import { noSquareLogoHandler, noLogosHandler } from '@test/mocks/api/handlers';

const { instance, accounts } = mockMsalWithAccounts;
const msGraph = new MsGraph(instance as IPublicClientApplication, accounts[0] as AccountInfo);

describe('MsGraphApi', () => {
  describe('getOrganizationDisplayName', () => {
    it('returns an organization name', async () => {
      const result = await msGraph.getOrganizationDisplayName();
      expect(result).toEqual('Company ABC');
    });
  });

  describe('getOrganizationLogo', () => {
    it('returns the organization logo url for a square image', async () => {
      const result = await msGraph.getOrganizationLogo();
      expect(result).toEqual('https://images.example/square');
    });

    it('returns the organization logo url for a favicon', async () => {
      server.use(...noSquareLogoHandler);
      const result = await msGraph.getOrganizationLogo();
      expect(result).toEqual('https://images.example/favicon');
    });

    it('returns empty string when there is no logo url', async () => {
      server.use(...noLogosHandler);
      const result = await msGraph.getOrganizationLogo();
      expect(result).toEqual('');
    });
  });
});
