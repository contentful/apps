import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  TextLink,
  Note,
  Card,
  Stack,
  Paragraph,
  FormControl,
  Spinner,
  Button,
} from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon, CheckCircleIcon, ErrorCircleIcon } from '@contentful/f36-icons';
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';

interface Props {
  serviceAccountKeyId: ServiceAccountKeyId;
  serviceAccountKey: ServiceAccountKey;
  onEditGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>;
  onAccountSummariesChange: Function;
}

export const GoogleErrorApiErrorTypes = {
  AdminAPI: 'AdminApiError',
  DataAPI: 'DataApiError',
  Unknown: 'Unknown',
};

interface GAErrorApiType {
  details: any;
  errorType: string;
  message: string;
}

const DisplayServiceAccountCard = (props: Props) => {
  const {
    serviceAccountKeyId,
    serviceAccountKey,
    onEditGoogleAccountDetails,
    onAccountSummariesChange,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [adminApiError, setAdminApiError] = useState<GAErrorApiType>();
  const [dataApiError, setDataApiError] = useState<GAErrorApiType>();
  const [unspecifiedAdminError, setUnspecifiedAdminError] = useState<GAErrorApiType>();
  const [unspecifiedDataError, setUnspecifiedDataError] = useState<GAErrorApiType>();

  // NOTE: Due to a bug installation parameters are not available at sdk.parameters.installation form the config screen
  // location. Therefore we must pass down the values directly to the useApi hook. If the bug is fixed this won't be
  // necessary
  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  const verifyAdminApi = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedAccountSummaries = await api.listAccountSummaries();
      if (fetchedAccountSummaries.res && !fetchedAccountSummaries.res.ok) {
        setAdminApiError(fetchedAccountSummaries.errors);
        return;
      }

      onAccountSummariesChange(fetchedAccountSummaries);
      setAdminApiError(undefined);
      setUnspecifiedAdminError(undefined)
    } catch (e: any) {
      setUnspecifiedAdminError({
        details: null,
        errorType: GoogleErrorApiErrorTypes.AdminAPI,
        message: 'Unknown Google Admin API Error',
      });
    } finally {
      setIsLoading(false);
    }

    return () => {
      setAdminApiError(undefined);
      setUnspecifiedAdminError(undefined)
      setIsLoading(false);
    }
  
  // It wants to add onAccountSummariesChange as a dependency but this will cause an infinite re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const verifyDataApi = useCallback(async () => {
    try {
      setIsLoading(true);
      const pagedData = await api.getPageData();

      // If we get a 400 it means auth check passes and api has been enabled
      if (pagedData.res && !pagedData.res.ok && pagedData.res.status !== 400) {
        setDataApiError(pagedData.errors);
        return;
      }

      setDataApiError(undefined);
      setUnspecifiedDataError(undefined)
    } catch (e: any) {
      setUnspecifiedDataError({
        details: null,
        errorType: GoogleErrorApiErrorTypes.AdminAPI,
        message: 'Unknown Google Admin API Error',
      });
    } finally {
      setIsLoading(false);
    }


    return () => {
      setDataApiError(undefined);
      setUnspecifiedDataError(undefined)
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    verifyAdminApi();
    verifyDataApi();
  }, [verifyAdminApi, verifyDataApi]);

  const handleApiTestClick = () => {
    verifyAdminApi();
    verifyDataApi();
  };

  interface BadgeNoteType {
    badgeLabel: string;
    noteMessage: string;
  }

  const RenderSimpleBadgeNote = ({ badgeLabel, noteMessage }: BadgeNoteType) => {
    return (
      <Stack spacing="spacingL" marginBottom="none" alignItems="flex-start" flexDirection="column">
        <Badge variant="negative">{badgeLabel}</Badge>
        <Note variant="warning">{noteMessage}</Note>
      </Stack>
    );
  };

  const RenderStatusInfo = () => {
    if (adminApiError && dataApiError) {
      return (
        <Stack
          spacing="spacingL"
          marginBottom="none"
          alignItems="flex-start"
          flexDirection="column">
          <Flex gap="spacingS">
            <Badge variant="negative">API Admin Error</Badge>
            <Badge variant="negative">API Data Error</Badge>
          </Flex>
          <Note variant="warning">{adminApiError.message}</Note>
          <Note variant="warning">{dataApiError.message}</Note>
        </Stack>
      );
    } else if (adminApiError) {
      return (
        <RenderSimpleBadgeNote badgeLabel="Admin API Error" noteMessage={adminApiError.message} />
      );
    }
    else if (dataApiError) {
      return (
        <RenderSimpleBadgeNote badgeLabel="Data API Error" noteMessage={dataApiError.message} />
      );
    }
    else if (unspecifiedAdminError) {
      return (
        <RenderSimpleBadgeNote
          badgeLabel="Unspecified Admin API Error"
          noteMessage={unspecifiedAdminError.message}
        />
      );
    }
    else if (unspecifiedDataError) {
      return (
        <RenderSimpleBadgeNote
          badgeLabel="Unspecified Data API Error"
          noteMessage={unspecifiedDataError.message}
        />
      );
    }

    return <Badge variant="positive">Active</Badge>;
  };

  return (
    <Card>
      <Flex justifyContent="space-between" marginBottom="none">
        <Paragraph marginBottom="none" marginTop="spacingXs">
          <b>Google Service Account Details</b>
        </Paragraph>
        <Flex justifyContent="space-between" marginBottom="spacingL">
          <Box paddingRight="spacingXs" paddingTop="spacingXs">
            <TextLink
              testId="editServiceAccountButton"
              as="button"
              variant="primary"
              onClick={onEditGoogleAccountDetails}>
              Edit
            </TextLink>
          </Box>
          <Box style={{ minWidth: '60px', minHeight: '30px' }}>
            {isLoading ? (
              <Spinner variant="default" />
            ) : (
              <Button variant="primary" size="small" onClick={handleApiTestClick}>
                Test
              </Button>
            )}
          </Box>
        </Flex>
      </Flex>
      <FormControl>
        <FormControl.Label marginBottom="none">Service Account</FormControl.Label>
        <Paragraph>
          <Flex alignItems="center">
            <Box paddingRight="spacingS">
              <TextLink
                icon={<ExternalLinkTrimmedIcon />}
                alignIcon="end"
                href={`https://console.cloud.google.com/iam-admin/serviceaccounts/details/${serviceAccountKeyId.clientId}?project=${serviceAccountKeyId.projectId}`}
                target="_blank"
                rel="noopener noreferrer">
                {serviceAccountKeyId.clientEmail}
              </TextLink>
            </Box>
            {isLoading ? (
              <Spinner variant="default" />
            ) : adminApiError ? (
              <ErrorCircleIcon variant="negative" />
            ) : (
              <CheckCircleIcon variant="positive" />
            )}
          </Flex>
        </Paragraph>
      </FormControl>
      <FormControl>
        <FormControl.Label marginBottom="none">Key ID</FormControl.Label>
        <Paragraph>
          <Box as="code">{serviceAccountKeyId.id}</Box>
        </Paragraph>
      </FormControl>
      <FormControl marginBottom="none">
        <FormControl.Label marginBottom="none">Status</FormControl.Label>
        <Paragraph>{isLoading ? <Spinner variant="default" /> : <RenderStatusInfo />}</Paragraph>
      </FormControl>
    </Card>
  );
};

export default DisplayServiceAccountCard;
