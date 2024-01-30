import { vi } from 'vitest';
import { AccountInfo } from '@azure/msal-common';
import { IPublicClientApplication } from '@azure/msal-browser';

type MockMsal = {
  instance: MockInstance;
  accounts: MockAccount[];
};
type MockInstance = Partial<IPublicClientApplication>;
type MockAccount = Partial<AccountInfo>;

const mockMsal: MockMsal = {
  instance: {
    loginPopup: vi.fn(),
    logoutPopup: vi.fn(),
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
};

export { mockMsal };
