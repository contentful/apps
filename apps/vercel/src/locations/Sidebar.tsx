import { SidebarAppSDK } from '@contentful/app-sdk';
import { Box, Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import VercelClient from '../clients/Vercel';
import { Project } from '../types';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const { projects, selectedProject, vercelAccessToken } = sdk.parameters.installation;
  const client = new VercelClient(vercelAccessToken);

  const project = projects.find((project: Project) => project.id === selectedProject);

  const handleDeploy = async (e: any) => {
    e.preventDefault();

    try {
      await client.createDeployment(project);
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
