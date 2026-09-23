import { Paragraph } from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  /*
     To use the cma, access it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = sdk.cma;

  return <Paragraph>Hello Dialog Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Dialog;
