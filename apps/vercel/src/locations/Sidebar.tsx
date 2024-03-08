import { SyntheticEvent, useState } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { Box, Button, Spinner } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import VercelClient from '../clients/Vercel';
import { Project } from '../types';

const Sidebar = () => {
  useAutoResizer();
  const [loading, setIsLoading] = useState<boolean>(false);
  const sdk = useSDK<SidebarAppSDK>();
  const { projects, selectedProject, vercelAccessToken } = sdk.parameters.installation;
  const vercel = new VercelClient(vercelAccessToken);

  const project = projects.find((project: Project) => project.id === selectedProject);

  const handleDeploy = async (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      await vercel.createDeployment({ project });
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Button variant="primary" isFullWidth onClick={handleDeploy}>
        {loading ? <Spinner size="small" /> : `Deploy ${project.name}`}
      </Button>
    </Box>
  );
};

export default Sidebar;
