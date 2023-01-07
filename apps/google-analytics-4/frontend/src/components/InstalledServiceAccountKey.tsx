import { Badge, Box, Flex, Heading, Skeleton, TextLink } from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { useEffect, useState } from 'react';
import { Api, ApiError, Credentials } from '../services/api';

import type { ServiceAccountKeyId } from '../types';

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
};

interface InstalledServiceAccountKeyProps {
  serviceAccountKeyId: ServiceAccountKeyId | null;
}

const InstalledServiceAccountKey = ({ serviceAccountKeyId }: InstalledServiceAccountKeyProps) => {
  const [credentialsData, setCredentialsData] = useState<Credentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const api = new Api();
      try {
        const response = await api.getCredentials();
        setCredentialsData(response);
        setError('');
      } catch (e) {
        setCredentialsData(null);
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
  }, []);

  if (!serviceAccountKeyId) {
    return null;
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
          ) : error === '' ? (
            <Badge variant="positive">{credentialsData?.status}</Badge>
          ) : (
            <Badge variant="secondary">unknown</Badge>
          )}
        </dd>
      </dl>
    </Box>
  );
};

export default InstalledServiceAccountKey;
