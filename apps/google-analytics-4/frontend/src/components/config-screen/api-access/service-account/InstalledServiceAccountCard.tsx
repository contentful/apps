import { useEffect, useState } from 'react';
import { Badge, Box, Flex, TextLink, Note, Card, Stack, Paragraph, FormControl, Spinner } from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import { useApi } from 'hooks/useApi';
import { ApiError } from 'services/api';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';

interface Props {
  serviceAccountKeyId: ServiceAccountKeyId;
  serviceAccountKey: ServiceAccountKey;
  onEditGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>;
}

const InstalledServiceAccountCard = (props: Props) => {
  const {
    serviceAccountKeyId,
    serviceAccountKey,
    onEditGoogleAccountDetails
  } = props

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NOTE: Due to a bug installation parameters are not available at sdk.parameters.installation form the config screen
  // location. Therefore we must pass down the values directly to the useApi hook. If the bug is fixed this won't be
  // necessary
  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  useEffect(() => {
    const verifyAccountSummaries = async () => {
      try {
        const accountSummaries = await api.listAccountSummaries();
        console.log(accountSummaries)

        const accounts = await api.listAccounts();
        console.log(accounts)

        // Cases 
        // 1. Empty accounts (could be because of API Failures or no properties being set)
        if (accountSummaries.length === 0) {
          // TODO: add link to instructions on how to add a user to Google Analytics account/property
          //  - will require moving this error type to Note component content in a map or something
          throw new ApiError("Ensure your service account is added to the Google Analytics property you want to connect to. Right now, your service account isn't connected to any properties.")
        }
        else {

          setError(null);
        }
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
    }

    verifyAccountSummaries();
  }, [api]);

  if (!serviceAccountKeyId) {
    return null;
  }

  return (
    <Card>
      <Flex justifyContent="space-between" marginBottom='spacingL'>
        <Paragraph marginBottom='none'><b >Google Service Account Details</b></Paragraph>
        <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onEditGoogleAccountDetails}>Edit</TextLink>
      </Flex>

      <FormControl>
        <FormControl.Label marginBottom="none">Service Account</FormControl.Label>
        <Paragraph>
          <TextLink
            icon={<ExternalLinkTrimmedIcon />}
            alignIcon="end"
            href={`https://console.cloud.google.com/iam-admin/serviceaccounts/details/${serviceAccountKeyId.clientId}?project=${serviceAccountKeyId.projectId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {serviceAccountKeyId.clientEmail}
          </TextLink>
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
          {isLoading ? (
            <Spinner variant="default" />
          ) : !error ? (
            <Badge variant="positive">active</Badge>
          ) : (
            <Stack spacing='spacingL' marginBottom="none" alignItems='flex-start' flexDirection='column'>
              <Badge variant="warning">Inactive</Badge>
              <Note variant="neutral">{error}</Note>
            </Stack>
          )}
        </Paragraph>
      </FormControl>
    </Card>
  );
};

export default InstalledServiceAccountCard;
