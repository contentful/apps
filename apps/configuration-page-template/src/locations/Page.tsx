import { PageAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import ConfigPage from '../components/ConfigPage';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const [apiKey, setApiKey] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  return <ConfigPage />;
};

export default Page;
