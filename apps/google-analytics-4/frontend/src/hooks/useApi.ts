import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import { Api } from '../services/api';
import { ServiceAccountKey, ServiceAccountKeyId } from '../types';

export function useApi(
  serviceAccountKeyId?: ServiceAccountKeyId,
  serviceAccountKey?: ServiceAccountKey
): Api {
  const cma = useCMA();
  const sdk = useSDK();

  const accountKeyId = serviceAccountKeyId || sdk.parameters.installation.serviceAccountKeyId;

  // NOTE: The service account key file here will later be removed when it's moved to secret storage
  const accountKey = serviceAccountKey || sdk.parameters.installation.serviceAccountKey;

  const appDefinitionId = sdk.ids.app;

  if (!accountKeyId) {
    throw new Error('No ServiceAccountKeyId provided or found in installation parameters');
  }

  if (!accountKey) {
    throw new Error('No ServiceAccountKey provided or found in installation parameters');
  }

  if (!appDefinitionId) {
    throw new Error('No appDefinitionId found in sdk');
  }

  const api = useMemo(() => {
    return new Api(appDefinitionId, cma, accountKeyId, accountKey);
  }, [cma, accountKeyId, accountKey, appDefinitionId]);

  return api;
}
