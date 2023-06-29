import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { Paragraph } from '@contentful/f36-components';

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();

  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  return <Paragraph>Hello Page Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Sidebar;
