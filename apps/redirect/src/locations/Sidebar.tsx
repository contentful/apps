import { SidebarAppSDK } from '@contentful/app-sdk';
import { Paragraph } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();

  return <Paragraph>Redirect App Sidebar - Placeholder (AppId: {sdk.ids.app}).</Paragraph>;
};

export default Sidebar;
