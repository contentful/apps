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
  Skeleton,
} from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';
import { ApiErrorType, ERROR_TYPE_MAP, isApiErrorType } from 'apis/apiTypes';
import ServiceAccountChecklist from 'components/config-screen/api-access/display/ServiceAccountChecklist';
import { KeyValueMap } from 'contentful-management';

interface Props {
  serviceAccountKeyId: ServiceAccountKeyId;
  serviceAccountKey: ServiceAccountKey;
  onInEditModeChange: Function;
  onAccountSummariesChange: Function;
  isAppInstalled: boolean;
  parameters: KeyValueMap;
  onHasServiceCheckErrorsChange: Function;
}

const DisplayServiceAccountCard = (props: Props) => {
  const {
    serviceAccountKeyId,
    serviceAccountKey,
    onInEditModeChange,
    onAccountSummariesChange,
    isAppInstalled,
    parameters,
    onHasServiceCheckErrorsChange,
  } = props;

  const [isLoadingAdminApi, setIsLoadingAdminApi] = useState(true);
  const [isLoadingDataApi, setIsLoadingDataApi] = useState(true);

  const [adminApiError, setAdminApiError] = useState<ApiErrorType>();
  const [dataApiError, setDataApiError] = useState<ApiErrorType>();
  const [invalidServiceAccountError, setInvalidServiceAccountError] = useState<ApiErrorType>();
  const [unknownError, setUnknownError] = useState<ApiErrorType>();
  const [ga4PropertiesError, setGa4PropertiesError] = useState<ApiErrorType>();
  const [showChecks, setShowChecks] = useState<boolean>(false);

  // NOTE: Due to a bug installation parameters are not available at sdk.parameters.installation form the config screen
  // location. Therefore we must pass down the values directly to the useApi hook. If the bug is fixed this won't be
  // necessary
  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  const handleApiError = (error: ApiErrorType) => {
    switch (error.errorType) {
      case ERROR_TYPE_MAP.invalidServiceAccount:
        setInvalidServiceAccountError(error);
        break;
      case ERROR_TYPE_MAP.disabledAdminApi:
        setAdminApiError(error);
        break;
      case ERROR_TYPE_MAP.disabledDataApi:
        setDataApiError(error);
        break;
      case ERROR_TYPE_MAP.invalidProperty:
        setAdminApiError(undefined);
        setDataApiError(undefined);
        break;
      default:
        setUnknownError(error);
        throw error;
    }
  };

  const verifyAdminApi = useCallback(async () => {
    try {
      setIsLoadingAdminApi(true);
      const fetchedAccountSummaries = await api.listAccountSummaries();
      onAccountSummariesChange(fetchedAccountSummaries);
      fetchedAccountSummaries.length
        ? setGa4PropertiesError(undefined)
        : setGa4PropertiesError({
            errorType: ERROR_TYPE_MAP.noAccountsOrPropertiesFound,
            message: 'No accounts or properties could be found',
            status: 500,
          });
      setAdminApiError(undefined);
    } catch (e: any) {
      if (isApiErrorType(e)) handleApiError(e);
      else {
        setUnknownError(e);
        throw e;
      }
    } finally {
      setIsLoadingAdminApi(false);
    }

    return () => {
      setAdminApiError(undefined);
      setIsLoadingAdminApi(false);
    };

    // It wants to add onAccountSummariesChange as a dependency but this will cause an infinite re-render
    // isAppInstalled is needed as a dependency to trigger this called once the app is installed succesffully
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, isAppInstalled]);

  const verifyDataApi = useCallback(async () => {
    try {
      setIsLoadingDataApi(true);
      await api.runReports();
      setDataApiError(undefined);
    } catch (e: any) {
      if (isApiErrorType(e)) handleApiError(e);
      else {
        setUnknownError(e);
        throw e;
      }
    } finally {
      setIsLoadingDataApi(false);
    }

    return () => {
      setDataApiError(undefined);
      setIsLoadingDataApi(false);
    };

    // isAppInstalled is needed as a dependency to trigger this called once the app is installed succesffully
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, isAppInstalled]);

  useEffect(() => {
    onHasServiceCheckErrorsChange(
      adminApiError ||
        dataApiError ||
        ga4PropertiesError ||
        invalidServiceAccountError ||
        unknownError
    );
  }, [
    adminApiError,
    dataApiError,
    ga4PropertiesError,
    onHasServiceCheckErrorsChange,
    invalidServiceAccountError,
    unknownError,
  ]);

  const handleErrorChanges = useCallback(() => {
    adminApiError || dataApiError || invalidServiceAccountError || ga4PropertiesError
      ? setShowChecks(true)
      : setShowChecks(false);
  }, [adminApiError, dataApiError, ga4PropertiesError, invalidServiceAccountError]);

  useEffect(() => {
    verifyAdminApi();
    verifyDataApi();
  }, [verifyAdminApi, verifyDataApi]);

  const handleApiTestClick = () => {
    verifyAdminApi();
    verifyDataApi();
    setUnknownError(undefined);
    handleErrorChanges();
  };

  useEffect(() => {
    handleErrorChanges();
  }, [handleErrorChanges]);

  interface BadgeNoteType {
    badgeLabel: string;
    noteMessage?: string;
  }

  // TODO: Update these Render functions (RenderSimpleBadgeNote, RenderStatusInfo) to have more robust error messages for the user to act upon
  // Also needs a UI refresh to look prettier
  const RenderSimpleBadgeNote = ({ badgeLabel, noteMessage }: BadgeNoteType) => {
    return (
      <Stack spacing="spacingL" marginBottom="none" alignItems="flex-start" flexDirection="column">
        <Badge variant="negative">{badgeLabel}</Badge>
        {noteMessage && <Note variant="warning">{noteMessage}</Note>}
      </Stack>
    );
  };

  const RenderStatusInfo = () => {
    if (invalidServiceAccountError || adminApiError || dataApiError || ga4PropertiesError) {
      return <RenderSimpleBadgeNote badgeLabel="Some checks were unsuccessful" />;
    } else if (unknownError) {
      return (
        <RenderSimpleBadgeNote
          badgeLabel="Unknown Error"
          noteMessage={
            'An unknown error occurred. You can try the action again in a few minutes, or contact support if the error persists.'
          }
        />
      );
    }

    return <Badge variant="positive">Active</Badge>;
  };

  return (
    <Card>
      {isLoadingAdminApi || isLoadingDataApi ? (
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={8} />
        </Skeleton.Container>
      ) : (
        <>
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
                  onClick={() => onInEditModeChange(true)}>
                  Edit
                </TextLink>
              </Box>
              <Box style={{ minWidth: '60px', minHeight: '30px' }}>
                {isLoadingAdminApi && isLoadingDataApi ? (
                  <Spinner variant="primary" />
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
            <Paragraph>
              <Flex>
                <Box paddingRight="spacingS">
                  <RenderStatusInfo />
                </Box>
                {!unknownError && (
                  <Box>
                    {showChecks ? (
                      <TextLink as="button" variant="primary" onClick={() => setShowChecks(false)}>
                        Hide all checks
                      </TextLink>
                    ) : (
                      <TextLink as="button" variant="primary" onClick={() => setShowChecks(true)}>
                        Show all checks
                      </TextLink>
                    )}
                  </Box>
                )}
              </Flex>
            </Paragraph>
          </FormControl>
          {!unknownError && showChecks && (
            <ServiceAccountChecklist
              adminApiError={adminApiError}
              dataApiError={dataApiError}
              invalidServiceAccountError={invalidServiceAccountError}
              ga4PropertiesError={ga4PropertiesError}
              parameters={parameters}
            />
          )}
        </>
      )}
    </Card>
  );
};

export default DisplayServiceAccountCard;
