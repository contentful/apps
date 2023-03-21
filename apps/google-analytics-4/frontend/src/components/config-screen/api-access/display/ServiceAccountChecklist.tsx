import { Accordion, Text, Box, Flex } from '@contentful/f36-components';
import { ApiErrorType } from 'apis/apiTypes';
import { CheckCircleIcon, WarningIcon, ClockIcon } from '@contentful/f36-icons';

interface Props {
  adminApiError: ApiErrorType | undefined;
  dataApiError: ApiErrorType | undefined;
  invalidServiceAccountError: ApiErrorType | undefined;
  ga4PropertiesError: ApiErrorType | undefined;
}

export default function ServiceAccountChecklist(props: Props) {
  const { invalidServiceAccountError, adminApiError, dataApiError, ga4PropertiesError } = props;

  return (
    <Accordion>
      <Accordion.Item
        title={
          <Flex alignItems="center">
            {invalidServiceAccountError ? (
              <WarningIcon variant="warning" />
            ) : (
              <CheckCircleIcon variant="positive" />
            )}
            <Box paddingLeft="spacingXs">Service Account Check</Box>
          </Flex>
        }>
        <Text>
          {invalidServiceAccountError
            ? invalidServiceAccountError.message
            : 'Valid service account and service account key.'}
        </Text>
      </Accordion.Item>
      <Accordion.Item
        title={
          <Flex alignItems="center">
            {invalidServiceAccountError ? (
              <ClockIcon variant="muted" />
            ) : adminApiError ? (
              <WarningIcon variant="warning" />
            ) : (
              <CheckCircleIcon variant="positive" />
            )}
            <Box paddingLeft="spacingXs">Admin Api Check</Box>
          </Flex>
        }>
        <Text>
          {invalidServiceAccountError
            ? 'This check cannot be run without a valid service account and service account key'
            : adminApiError
            ? adminApiError.message
            : 'Admin API successful connected.'}
        </Text>
      </Accordion.Item>
      <Accordion.Item
        title={
          <Flex alignItems="center">
            {invalidServiceAccountError ? (
              <ClockIcon variant="muted" />
            ) : dataApiError ? (
              <WarningIcon variant="warning" />
            ) : (
              <CheckCircleIcon variant="positive" />
            )}
            <Box paddingLeft="spacingXs">Data Api Check</Box>
          </Flex>
        }>
        <Text>
          {invalidServiceAccountError
            ? 'This check cannot be run without a valid service account and service account key'
            : dataApiError
            ? dataApiError.message
            : 'Data API successful connected.'}
        </Text>
      </Accordion.Item>
      <Accordion.Item
        title={
          <Flex alignItems="center">
            {invalidServiceAccountError || adminApiError ? (
              <ClockIcon variant="muted" />
            ) : ga4PropertiesError ? (
              <WarningIcon variant="warning" />
            ) : (
              <CheckCircleIcon variant="positive" />
            )}
            <Box paddingLeft="spacingXs">Google Analytics 4 Accounts and Properties Check</Box>
          </Flex>
        }>
        <Text>
          {invalidServiceAccountError || adminApiError
            ? `This check cannot be run without a valid service account and service account key and the Admin API being enabled`
            : ga4PropertiesError
            ? ga4PropertiesError.message
            : 'Google Analytics 4 accounts and properties found successfully.'}
        </Text>
      </Accordion.Item>
    </Accordion>
  );
}
