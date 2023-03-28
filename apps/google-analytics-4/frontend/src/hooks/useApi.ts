import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import { Api } from '../apis/api';
import { ServiceAccountKeyId } from '../types';
import { contentfulContext } from '../helpers/contentfulContext';

export function useApi(serviceAccountKeyId?: ServiceAccountKeyId): Api {
  const cma = useCMA();
  const sdk = useSDK();

  const accountKeyId = serviceAccountKeyId || sdk.parameters.installation.serviceAccountKeyId;

  if (!accountKeyId) {
    throw new Error('No ServiceAccountKeyId provided or found in installation parameters');
  }

  const api = useMemo(() => {
    return new Api(contentfulContext(sdk), cma, accountKeyId);
  }, [cma, accountKeyId, sdk]);

  return api;
}
