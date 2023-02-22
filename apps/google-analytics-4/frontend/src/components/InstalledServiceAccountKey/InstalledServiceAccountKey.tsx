import { Badge, Box, Flex, Heading, Skeleton, TextLink, Note } from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';

import type { ServiceAccountKey, ServiceAccountKeyId } from '../../types';
import { useApi } from '../../hooks/useApi';

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
    marginTop: tokens.spacing2Xs,
  }),
};

interface InstalledServiceAccountKeyProps {
  serviceAccountKeyId: ServiceAccountKeyId;
  serviceAccountKey: ServiceAccountKey;
}

const InstalledServiceAccountKey = ({
  serviceAccountKeyId,
  serviceAccountKey,
}: InstalledServiceAccountKeyProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NOTE: Due to a bug installation parameters are not available at sdk.parameters.installation form the config screen
  // location. Therefore we must pass down the values directly to the useApi hook. If the bug is fixed this won't be
  // necessary
  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  useEffect(() => {
    (async () => {
      try {
        const accountSummaries = await api.listAccountSummaries();
        if (accountSummaries.length === 0) {
          throw new ApiError(
            "You need to make sure your service account is added to the property you want to connect this space to. Right now, your service account isn't connected to any Analytics properties."
          );
        } else setError(null);
      } catch (e) {
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
          ) : !error ? (
            <Badge variant="positive">active</Badge>
          ) : (
            <>
              <Badge variant="warning">Inactive</Badge>
              <Note variant="neutral" className={styles.errorNote}>
                {error}
              </Note>
            </>
          )}
        </dd>
      </dl>
    </Box>
  );
};

export default InstalledServiceAccountKey;
