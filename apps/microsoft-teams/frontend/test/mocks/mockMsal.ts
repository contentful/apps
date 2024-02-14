import { vi } from 'vitest';
import { AccountInfo } from '@azure/msal-common';
import { IPublicClientApplication } from '@azure/msal-browser';

type MockMsal = {
  instance: MockInstance;
  accounts: MockAccount[];
  inProgress: string;
};
type MockInstance = Partial<IPublicClientApplication>;
type MockAccount = Partial<AccountInfo>;

const mockMsalWithoutAccounts: MockMsal = {
  instance: {
    loginPopup: vi.fn(),
    logoutPopup: vi.fn(),
  },
  accounts: [],
  inProgress: 'none',
};

const mockMsalWithAccounts: MockMsal = {
  instance: {
    loginPopup: vi.fn(),
    logoutPopup: vi.fn(),
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
  },
  accounts: [
    {
      homeAccountId: 'home-account-id',
      environment: 'login.windows.net',
      tenantId: 'tenant-id',
      username: 'username@companyabc.com',
      localAccountId: 'local-account-id',
      name: 'Company ABC',
    },
  ],
  inProgress: 'none',
};

export { mockMsalWithoutAccounts, mockMsalWithAccounts };
