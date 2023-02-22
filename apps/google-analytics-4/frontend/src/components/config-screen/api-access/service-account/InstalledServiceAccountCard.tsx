import { useEffect, useState } from 'react';
import { Badge, Box, Flex, TextLink, Note, Card, Stack, Paragraph, FormControl, Spinner, List, BadgeVariant, IconButton } from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon, CycleIcon, CheckCircleIcon, ErrorCircleIcon } from '@contentful/f36-icons';
import { useApi } from 'hooks/useApi';
import { ApiError } from 'services/api';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';
import flatten from 'lodash/flatten'

interface Props {
  serviceAccountKeyId: ServiceAccountKeyId;
  serviceAccountKey: ServiceAccountKey;
  onEditGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>;
}

interface ErrorType {
  type: ERROR_ENUMS,
  badgeText: string,
  badgeVariant: BadgeVariant,
  description: string,
  resourceLink?: string,
  documentationLink?: string
}

enum ERROR_ENUMS { unknown, adminApi, dataApi, noAccounts, noProperties }

const InstalledServiceAccountCard = (props: Props) => {
  const {
    serviceAccountKeyId,
    serviceAccountKey,
    onEditGoogleAccountDetails
  } = props

  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorType[]>([])
  const [properties, setProperties] = useState<any[]>([]);

  // NOTE: Due to a bug installation parameters are not available at sdk.parameters.installation form the config screen
  // location. Therefore we must pass down the values directly to the useApi hook. If the bug is fixed this won't be
  // necessary
  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  const getPropertiesFromAccountSummaries = (accountSummaries: any[]) => {
    const rawPropertySummaries = accountSummaries.map((account) => {
      return account.propertySummaries
    });
    const flattenedProperties = flatten(rawPropertySummaries);
    return flattenedProperties
  }

  const verifyAccountSummaries = async () => {
    const _errors = [];
    let _properties = [] as any[];

    // Cases 
    // 1. Empty accounts (could be because of API Failures or no properties being set)
    // 2. Empty properties (accounts setup but no properties assigned to accounts)
    // 3. What if account got deleted (doesn't matter as they get filtered out anyways)
    try {
      setIsLoading(true);
      const accountSummaries = await api.listAccountSummaries();
      throw new ApiError('bruh');

      console.log(accountSummaries)
      _properties = getPropertiesFromAccountSummaries(accountSummaries)

      if (accountSummaries.length === 0) {
        // TODO: add link to instructions on how to add a user to Google Analytics account/property
        //  - will require moving this error type to Note component content in a map or something
        const _error = {
          type: ERROR_ENUMS.noAccounts,
          badgeText: "Error",
          badgeVariant: "negative",
          description: "No account could be found, please check that one is configured by clicking",
          resourceLink: 'https://analytics.google.com/analytics/web/',
          docs: 'https://www.contentful.com/help/google-analytics-app/',
        } as ErrorType
        _errors.push(_error)
      }
      else if (_properties.length === 0) {
        const _error = {
          type: ERROR_ENUMS.noProperties,
          badgeText: "Error",
          badgeVariant: "negative",
          description: "No properties found from active accounts. Please configure properties to the active account by clicking",
          resourceLink: 'https://analytics.google.com/analytics/web/',
          docs: 'https://www.contentful.com/help/google-analytics-app/',
        } as ErrorType
        _errors.push(_error)
      }
    } catch (e) {
      if (e instanceof ApiError) {
        const _error = {
          type: ERROR_ENUMS.adminApi,
          badgeText: "Invalid",
          badgeVariant: "negative",
          description: "Admin API Key, please reconfigure your api key by following these steps by clicking",
          resourceLink: 'https://console.cloud.google.com/projectselector2/',
          docs: 'https://www.contentful.com/help/google-analytics-app/',
        } as ErrorType
        _errors.push(_error)
      }
      else {
        console.error(e);
        const _error = {
          type: ERROR_ENUMS.unknown,
          badgeText: "Error",
          badgeVariant: "negative",
          description: "Unknown Error detected, please submit a ticket.",
        } as ErrorType
        _errors.push(_error)
      }
    } finally {
      setProperties(_properties)
      setErrors([..._errors])
      setIsLoading(false);
    }
  }

  useEffect(() => {
    verifyAccountSummaries();
  }, [api]);

  if (!serviceAccountKeyId) {
    return null;
  }

  const printErrorNotes = () => {
    return errors.map((error: ErrorType) => {
      return (
        <>
          <Badge variant={error.badgeVariant}>{error.badgeText}</Badge>
          <Note variant={error.badgeVariant as any} >{error.description}
            {' '}
            <TextLink
              icon={<ExternalLinkTrimmedIcon />}
              alignIcon="end"
              href={error.resourceLink}
              target="_blank"
              rel="resource link"
            >
              here
            </TextLink>
            {' '}and consult the steps in this{' '}
            <TextLink
              icon={<ExternalLinkTrimmedIcon />}
              alignIcon="end"
              href={error.documentationLink}
              target="_blank"
              rel="documentation link"
            >
              document
            </TextLink>
            .
          </Note>
        </>
      )
    })
  }

  return (
    <Card>
      <Flex justifyContent="space-between" marginBottom='spacingS'>
        <Paragraph marginBottom='none'><b>Google Service Account Details</b></Paragraph>
        <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onEditGoogleAccountDetails}>Edit</TextLink>
      </Flex>

      <FormControl>
        <FormControl.Label marginBottom="none">Service Account</FormControl.Label>
        <Paragraph>
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <Box paddingRight='spacingS'>
                <TextLink
                  icon={<ExternalLinkTrimmedIcon />}
                  alignIcon="end"
                  href={`https://console.cloud.google.com/iam-admin/serviceaccounts/details/${serviceAccountKeyId.clientId}?project=${serviceAccountKeyId.projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {serviceAccountKeyId.clientEmail}
                </TextLink>
              </Box>
              {isLoading ? <Spinner variant="default" /> : errors.filter(e => e.type === ERROR_ENUMS.adminApi).length === 0 ? <CheckCircleIcon variant="positive" /> : <ErrorCircleIcon variant="negative" />}
            </Flex>
            <Box>
              {isLoading ?
                <Spinner variant="default" /> :
                <IconButton
                  variant="transparent"
                  size="small"
                  aria-label="refresh-button"
                  onClick={verifyAccountSummaries}
                  icon={<CycleIcon />}
                />
              }
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
          {isLoading ? (
            <Spinner variant="default" />
          ) : errors.length === 0 ? (
            <Badge variant="positive">active</Badge>
          ) : (
            <Stack spacing='spacingL' marginBottom="none" alignItems='flex-start' flexDirection='column'>
              {printErrorNotes()}
            </Stack>
          )}
        </Paragraph>
      </FormControl>

      <List>
        {properties.length > 0 &&
          properties.map((property: any) => <List.Item key={property.property}>{property.displayName}</List.Item>)
        }
      </List>
    </Card >
  );
};

export default InstalledServiceAccountCard;
