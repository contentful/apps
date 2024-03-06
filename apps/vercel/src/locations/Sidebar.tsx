import { SidebarAppSDK } from '@contentful/app-sdk';
import { Box, Button, Spinner } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import VercelClient from '../clients/Vercel';
import { Project } from '../types';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const [loading, setIsLoading] = useState<boolean>(false);
  const sdk = useSDK<SidebarAppSDK>();
  const { projects, selectedProject, vercelAccessToken } = sdk.parameters.installation;
  const vercel = new VercelClient(vercelAccessToken);

  useAutoResizer();

  const project = projects.find((project: Project) => project.id === selectedProject);

  const handleDeploy = async (e: any) => {
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
        {loading ? (
          <>
            <Spinner size="small" style={{ color: 'white' }} />
          </>
        ) : (
          `Deploy ${project.name}`
        )}
      </Button>
    </Box>
  );
};

export default Sidebar;
