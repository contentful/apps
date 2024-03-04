import { SidebarAppSDK } from '@contentful/app-sdk';
import { Box, Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import VercelClient from '../clients/Vercel';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const client = new VercelClient(sdk.parameters.installation.vercelAccessToken);

  const handleDeploy = async (e: any) => {
    e.preventDefault();

    try {
      await client.createDeployment();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Box>
      <Button variant="primary" isFullWidth={true} onClick={handleDeploy}>
        Deploy
      </Button>
    </Box>
  );
};

export default Sidebar;
