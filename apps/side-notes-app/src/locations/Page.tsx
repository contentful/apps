import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect } from 'react';

const Page = () => {
  const sdk = useSDK();

  useEffect(() => {
    sdk.navigator.openAppConfig();
  }, []);
  return null;
};

export default Page;
