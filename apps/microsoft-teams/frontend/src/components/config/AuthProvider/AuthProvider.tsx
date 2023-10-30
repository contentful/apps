import { ReactNode } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from '@configs/authConfig';

interface Props {
  children: ReactNode;
}

const msalInstance = new PublicClientApplication(msalConfig);

const AuthProvider = (props: Props) => {
  const { children } = props;

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};

export default AuthProvider;
