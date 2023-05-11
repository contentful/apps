import { Badge, Box, Card, Flex, Grid, Text } from '@contentful/f36-components';
import { ExternalResource, ResourceCardProps, ExternalResourceLink } from '../types';
import { useEffect, useState } from 'react';
import fetchWithSignedRequest from '../helpers/signedRequests';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { config } from '../config';
import MissingResourceCard from './MissingResourceCard';
import { useDebounce } from 'usehooks-ts';
import ResourceCardRawData from './ResourceCardRawData';
import tokens from '@contentful/f36-tokens';
import ResourceCardMenu from './ResourceCardMenu';

const ResourceCard = (props: ResourceCardProps) => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();

  const [externalResource, setExternalResource] = useState<ExternalResource>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [errorStatus, setErrorStatus] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const debouncedValue = useDebounce(props.value, 300);
  const [showJson, setShowJson] = useState<boolean>(false);

  const fetchExternalResource = async (resource: ExternalResourceLink) => {
    const url = new URL(`${config.backendApiUrl}/api/resource`);
    const [resourceProvider, resourceType] = resource.sys?.linkType?.split(':');
    const data = await fetchWithSignedRequest(
      url,
      sdk.ids.app!,
      cma,
      'POST',
      {
        'x-contentful-data-provider': resourceProvider.toLowerCase(),
      },
      resource
    )
      .then((res) => {
        if (res.ok) {
          setError(undefined);
          setErrorStatus(undefined);
          return res.json();
        }

        setErrorStatus(res.status);
        throw new Error(res.statusText);
      })
      .then((data) => data)
      .catch((error) => {
        console.error(errorStatus, error.message);
        setError(
          `Error fetching ${resourceType ? resourceType : 'external resource'}${
            resource.sys?.urn ? ` "${resource.sys.urn}"` : ''
          }${resourceProvider ? ` from ${resourceProvider}` : ''}.`
        );
        setErrorMessage(error.message);
        return {};
      });

    return data;
  };

  useEffect(() => {
    fetchExternalResource(props.value).then((resource) => {
      setExternalResource(resource);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  if (error) {
    return (
      <MissingResourceCard
        index={props.index}
        total={props.total}
        onRemove={props.onRemove}
        onMoveToBottom={props.onMoveToBottom}
        onMoveToTop={props.onMoveToTop}
        isLoading={isLoading}
        error={error}
        value={JSON.stringify(props.value)}
        errorMessage={errorMessage}
        errorStatus={errorStatus}
        dragHandleRender={props.dragHandleRender}
      />
    );
  }

  const [resourceProvider, resourceType] = props.value.sys?.linkType?.split(':');

  return (
    <Card
      padding="none"
      isLoading={isLoading}
      withDragHandle={!!props.dragHandleRender}
      dragHandleRender={props.dragHandleRender}
      isHovered={false}>
      <Box paddingLeft="spacingM" style={{ borderBottom: `1px solid ${tokens.gray200}` }}>
        <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
          <Text fontColor="gray600" isWordBreak={true}>
            {resourceProvider} {resourceType}
          </Text>
          <Flex alignItems="center" isInline={true}>
            {externalResource.status && <Badge variant="featured">{externalResource.status}</Badge>}
            <ResourceCardMenu
              onRemove={() => props.onRemove(props.index)}
              isDataVisible={showJson}
              onToggleDataVisible={() => setShowJson((previousState) => !previousState)}
              index={props.index}
              total={props.total}
              onMoveToBottom={() => props.onMoveToBottom?.call(null, props.index)}
              onMoveToTop={() => props.onMoveToTop?.call(null, props.index)}
            />
          </Flex>
        </Flex>
      </Box>
      <Box padding="spacingM">
        <Flex fullWidth={true} justifyContent="space-between">
          <Grid rowGap="spacingXs">
            <Grid.Item>
              <Text
                fontSize="fontSizeL"
                fontWeight="fontWeightDemiBold"
                lineHeight="lineHeightL"
                isWordBreak={true}>
                {externalResource.name}
              </Text>
            </Grid.Item>
            <Grid.Item>
              <Text>{externalResource.description}</Text>
            </Grid.Item>
          </Grid>
          {externalResource.image && (
            <img src={externalResource.image} alt={externalResource.name} width="70" height="70" />
          )}
        </Flex>
        <ResourceCardRawData
          value={JSON.stringify(props.value)}
          isVisible={showJson}
          onHide={() => setShowJson(false)}
        />
      </Box>
    </Card>
  );
};

export default ResourceCard;
