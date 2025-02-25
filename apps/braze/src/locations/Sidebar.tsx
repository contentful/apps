import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  return (
    <Button
      variant="primary"
      isFullWidth={true}
      onClick={async () => {
        sdk.dialogs.openCurrentApp({
          title: 'Generate Braze Connected Content Call',
        });
      }}>
      Generate Braze Connected Content
    </Button>
  );
};

export default Sidebar;
