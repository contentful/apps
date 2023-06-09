import { Badge, Box, Card, Flex, Grid, Text } from '@contentful/f36-components';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';
import { useContext, useEffect, useState } from 'react';
import { useDebounce } from 'usehooks-ts';
import MissingResourceCard from '../MissingResourceCard/MissingResourceCard';
import ResourceCardMenu from '../ResourceCardMenu/ResourceCardMenu';
import ResourceCardRawData from '../ResourceCardRawData/ResourceCardRawData';
import ResourceFieldContext from 'context/ResourceFieldContext';
import tokens from '@contentful/f36-tokens';
import useExternalResource from 'hooks/field/useExternalResource';
import type { ExternalResourceLink } from 'types';
import type { RenderDragFn } from '@contentful/field-editor-reference/dist/types';

export interface ResourceCardProps {
  value: ExternalResourceLink;
  index: number;
  total: number;
  dragHandleRender?: RenderDragFn;
}

const ResourceCard = (props: ResourceCardProps) => {
  const { value, index, total, dragHandleRender } = props;
  const { handleRemove, handleMoveToBottom, handleMoveToTop } = useContext(ResourceFieldContext);

  const [showJson, setShowJson] = useState<boolean>(false);

  const [resourceLink, setResourceLink] = useState<ExternalResourceLink>(value);
  const debouncedValue = useDebounce(resourceLink, 300);

  const { resourceProvider, resourceType } = getResourceProviderAndType(debouncedValue);
  const { externalResource, isLoading, error, errorMessage, errorStatus } =
    useExternalResource(debouncedValue);

  useEffect(() => {
    const oldValue = JSON.stringify(resourceLink);
    const newValue = JSON.stringify(value);

    if (oldValue !== newValue) {
      setResourceLink(value);
    }
  }, [resourceLink, value]);

  if (error) {
    return (
      <MissingResourceCard
        {...props}
        error={error}
        errorMessage={errorMessage}
        errorStatus={errorStatus}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Card
      padding="none"
      isLoading={isLoading}
      withDragHandle={!!dragHandleRender}
      dragHandleRender={dragHandleRender}
      isHovered={false}>
      <Box paddingLeft="spacingM" style={{ borderBottom: `1px solid ${tokens.gray200}` }}>
        <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
          <Text fontColor="gray600" isWordBreak={true}>
            {resourceProvider} {resourceType}
          </Text>
          <Flex alignItems="center" isInline={true}>
            {externalResource.status && <Badge variant="featured">{externalResource.status}</Badge>}
            <ResourceCardMenu
              onRemove={() => handleRemove(index)}
              isDataVisible={showJson}
              onShowData={() => setShowJson(true)}
              onHideData={() => setShowJson(false)}
              index={index}
              total={total}
              onMoveToBottom={() => handleMoveToBottom?.call(null, index)}
              onMoveToTop={() => handleMoveToTop?.call(null, index)}
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
          value={JSON.stringify(value)}
          isVisible={showJson}
          onHide={() => setShowJson(false)}
        />
      </Box>
    </Card>
  );
};

export default ResourceCard;
