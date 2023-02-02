import { useCMA } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import { Api } from '../services/api';
import { ServiceAccountKey, ServiceAccountKeyId } from '../types';

export function useApi(
  serviceAccountKeyId?: ServiceAccountKeyId,
  serviceAccountKey?: ServiceAccountKey
): Api {
  const cma = useCMA();

  const accountKeyId = serviceAccountKeyId;
  const accountKey = serviceAccountKey;

  if (!accountKeyId) {
    throw new Error('No ServiceAccountKeyId provided or found in installation parameters');
  }

  if (!accountKey) {
    throw new Error('No ServiceAccountKey provided or found in installation parameters');
  }

  const api = useMemo(() => {
    return new Api('app_definition_api', cma, accountKeyId, accountKey);
  }, [cma, accountKeyId, accountKey]);

  return api;
}
