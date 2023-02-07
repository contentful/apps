import { Badge, Box, Flex, Heading, Note, Skeleton, TextLink } from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { useEffect, useState } from 'react';
import { ApiError, Credentials, GoogleApiError } from '../services/api';

import type { ServiceAccountKey, ServiceAccountKeyId } from '../types';
import { useApi } from '../hooks/useApi';

const styles = {
  serviceAccountDetails: css({
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
    border: '1px solid',
    borderColor: tokens.gray200,
    borderRadius: '10px',
    boxShadow: tokens.boxShadowDefault,
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingL,
    h3: {
      fontSize: tokens.fontSizeM,
      marginBottom: tokens.spacingXs,
    },
    '& dt': {
      marginTop: tokens.spacingS,
      fontWeight: tokens.fontWeightMedium,
      fontSize: tokens.fontSizeS,
    },
    '& dd': {
      marginBottom: tokens.spacingS,
    },

  }),
  errorNote: css({
    marginTop: tokens.spacing2Xs
  })
};

interface InstalledServiceAccountKeyProps {
  serviceAccountKeyId: ServiceAccountKeyId;
  serviceAccountKey: ServiceAccountKey;
}

const InstalledServiceAccountKey = ({
  serviceAccountKeyId,
  serviceAccountKey,
}: InstalledServiceAccountKeyProps) => {
  const [credentialsData, setCredentialsData] = useState<Credentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState(0)

  // NOTE: Due to a bug installation parameters are not available at sdk.parameters.installation form the config screen
  // location. Therefore we must pass down the values directly to the useApi hook. If the bug is fixed this won't be
  // necessary
  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.getCredentials();
        const accountSum = await api.listAccountSummaries();
        setCredentialsData(response);
        setError(null);
      } catch (e) {
        setCredentialsData(null);
        if (e instanceof GoogleApiError) {
          setErrorCode(e.code)
        }
        if (e instanceof ApiError) {
          setError(e.message);
        } else {
          console.error(e);
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [api]);

  if (!serviceAccountKeyId) {
    return null;
  }

  const errorTextByCode = (code: number) => {
    if (code === 16) return <p>Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See <a href="https://developers.google.com/identity/sign-in/web/devconsole-project" target="_blank">https://developers.google.com/identity/sign-in/web/devconsole-project</a>.</p>;
    else if (code === 7) return <p>Google Analytics Admin API has not been used in this project before or it is disabled. Enable it by visiting <a href="https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview" target="_blank">https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview</a> then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.</p>;
    else return <p>Unknown error with the API occurred.</p>;
  }

  return (
    <Box className={styles.serviceAccountDetails}>
      <Heading as="h3">
        <Flex alignItems="center">Installed Google Service Account Key</Flex>
      </Heading>
      <dl>
        <dt>Service Account</dt>
        <dd>
          <TextLink
            icon={<ExternalLinkTrimmedIcon />}
            alignIcon="end"
            href={`https://console.cloud.google.com/iam-admin/serviceaccounts/details/${serviceAccountKeyId.clientId}?project=${serviceAccountKeyId.projectId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {serviceAccountKeyId.clientEmail}
          </TextLink>
        </dd>
        <dt>Key ID</dt>
        <dd>
          <Box as="code">{serviceAccountKeyId.id}</Box>
        </dd>
        <dt>Status</dt>
        <dd>
          {isLoading ? (
            <Skeleton.Container svgHeight={21}>
              <Skeleton.DisplayText lineHeight={21} />
            </Skeleton.Container>
          ) : error === null ? (
            <Badge variant="positive">{credentialsData?.status}</Badge>
          ) : errorCode ? (
            <>
              <Badge variant="warning">Inactive</Badge>
              <Note variant="neutral" className={styles.errorNote}>{errorTextByCode(errorCode)}</Note>
            </>
          ) : (
            <Badge variant="secondary">unknown</Badge>
          )}
        </dd>
      </dl>
    </Box>
  );
};

export default InstalledServiceAccountKey;
