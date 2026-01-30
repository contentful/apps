import { PageAppSDK } from '@contentful/app-sdk';
import { Paragraph } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  return <Paragraph>Redirect App Page - Placeholder (AppId: {sdk.ids.app}).</Paragraph>;
};

export default Page;
