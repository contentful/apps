import { Paragraph } from '@contentful/f36-components';
import { HomeAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

const Home = () => {
  const sdk = useSDK<HomeAppSDK>();
  /*
     To use the cma, access it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = sdk.cma;

  return <Paragraph>Hello Home Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Home;
