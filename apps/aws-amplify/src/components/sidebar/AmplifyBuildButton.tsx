import { useEffect, useState, useCallback } from 'react';
import {
  AmplifyClient,
  StartJobCommand,
  StartJobCommandInput,
  GetAppCommand,
} from '@aws-sdk/client-amplify';
import useJobStatusPolling from '../../hooks/usePollingQuery';
import { buildAppUrl, formatLastDeployedTime } from '../../lib';

const appId = 'd2jfk8fxtawmvj';
const branchName = 'main';
const client = new AmplifyClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIA3Q3ACWGDQ2MI46WX',
    secretAccessKey: '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',
  },
});

function AmplifyBuildButton() {
  const [lastDeployedTime, setLastDeployedTime] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string>('');
  const [isJobComplete, setIsJobComplete] = useState<boolean>(false);
  const [appUrl, setAppUrl] = useState<string | null>(null);

  const handleBuild = useCallback(async () => {
    try {
      const input: StartJobCommandInput = {
        appId,
        branchName,
        jobType: 'RELEASE',
      };

      const startJobCommand = new StartJobCommand(input);
      const build = await client.send(startJobCommand);

      setJobId(build.jobSummary?.jobId!);

      if (build.jobSummary) {
        const initialStatus = build.jobSummary.status;
        console.log('Initial job status:', initialStatus);

        setLastDeployedTime(null);
        setIsBuilding(true);
        setIsJobComplete(false);
      }
    } catch (error) {
      console.error('Error triggering Amplify build:', error);
    }
  }, []);

  const pollingInterval = 5000;

  const onDeployed = useCallback(() => {
    setIsBuilding(false);
    setIsJobComplete(true);
  }, []);

  const jobStatus = useJobStatusPolling(
    client,
    appId,
    jobId,
    branchName,
    pollingInterval,
    onDeployed
  );

  useEffect(() => {
    const getLastDeployedTime = async () => {
      try {
        const getAppCommand = new GetAppCommand({
          appId,
        });

        const getAppResponse = await client.send(getAppCommand);

        if (getAppResponse.app) {
          const { productionBranch, defaultDomain } = getAppResponse.app;
          const lastDeployedTime = productionBranch?.lastDeployTime;

          setLastDeployedTime(formatLastDeployedTime(lastDeployedTime));
          setAppUrl(buildAppUrl(productionBranch?.branchName!, defaultDomain!));
        }
      } catch (error) {
        console.error('Error getting last deployed time:', error);
      }
    };

    getLastDeployedTime();
  }, []);

  useEffect(() => {
    if (jobStatus === 'SUCCEED' || jobStatus === 'FAILED') {
      setIsBuilding(false);
      setIsJobComplete(true);
    }
  }, [jobStatus]);

  useEffect(() => {
    if (isJobComplete) {
      getLastDeployedTime();
    }
  }, [isJobComplete]);

  const getLastDeployedTime = async () => {
    try {
      const getAppCommand = new GetAppCommand({
        appId,
      });

      const getAppResponse = await client.send(getAppCommand);

      if (getAppResponse.app) {
        const lastDeployedTime = getAppResponse.app.productionBranch?.lastDeployTime;

        setLastDeployedTime(formatLastDeployedTime(lastDeployedTime));
        setAppUrl(
          buildAppUrl(
            getAppResponse.app.productionBranch?.branchName!,
            getAppResponse.app.defaultDomain!
          )
        );
      }
    } catch (error) {
      console.error('Error getting last deployed time:', error);
    }
  };

  const handleOpenAppUrl = () => {
    if (appUrl) {
      window.open(appUrl, '_blank');
    }
  };

  return (
    <div>
      <div>
        <button onClick={handleBuild} disabled={isBuilding}>
          {isBuilding ? 'Building...' : 'Start Build'}
        </button>
        <button onClick={handleOpenAppUrl} disabled={!appUrl}>
          Open Amplify App
        </button>
      </div>
      {lastDeployedTime && <p>Last Deployed Time: {lastDeployedTime}</p>}
    </div>
  );
}

export default AmplifyBuildButton;
