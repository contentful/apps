import { useEffect, useState, useCallback, useRef } from 'react';
import { GetJobCommand, GetJobCommandOutput } from '@aws-sdk/client-amplify';

type JobStatus = 'IN_PROGRESS' | 'SUCCEED' | 'FAILED' | null;

function useJobStatusPolling(
  client: any,
  appId: string,
  jobId: string,
  branchName: string,
  pollingInterval: number,
  onDeployed: () => void
): JobStatus | undefined {
  const [jobStatus, setJobStatus] = useState<JobStatus | undefined>(undefined);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollJobStatus = useCallback(async () => {
    try {
      const getJobCommand = new GetJobCommand({
        appId,
        jobId,
        branchName,
      });

      const getJobResponse: GetJobCommandOutput = await client.send(getJobCommand);

      console.log({ getJobResponse });

      if (getJobResponse.job) {
        const steps = getJobResponse.job.steps ?? [];
        const status = steps[steps.length - 1]?.status;

        if (status === 'IN_PROGRESS') {
          setJobStatus(status);
        } else if (status === 'SUCCEED') {
          clearInterval(pollingIntervalRef.current!);
          onDeployed();
          setJobStatus(status);
        } else {
          setJobStatus(null);
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  }, [client, appId, jobId, branchName, onDeployed]);

  useEffect(() => {
    if (jobId) {
      pollingIntervalRef.current = setInterval(pollJobStatus, pollingInterval);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [jobId, pollJobStatus, pollingInterval]);

  return jobStatus;
}

export default useJobStatusPolling;
