import { Badge, Box, Card, Flex, Grid, Text } from '@contentful/f36-components';
import { useState } from 'react';
import ResourceCardRawData from './ResourceCardRawData';
import tokens from '@contentful/f36-tokens';
import ResourceCardMenu from './ResourceCardMenu';
import { ResourceCardProps } from '../types';
import MissingResourceCard from './MissingResourceCard';
import { useDebounce } from 'usehooks-ts';
import useExternalResource from '../hooks/useExternalResource';

const ResourceCard = (props: ResourceCardProps) => {
  const debouncedValue = useDebounce(props.value, 300);
  const { hydratedResourceData, isLoading, error, errorMessage, errorStatus } =
    useExternalResource(debouncedValue);
  const [showJson, setShowJson] = useState<boolean>(false);

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
            {hydratedResourceData.status && (
              <Badge variant="featured">{hydratedResourceData.status}</Badge>
            )}
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
                {hydratedResourceData.name}
              </Text>
            </Grid.Item>
            <Grid.Item>
              <Text>{hydratedResourceData.description}</Text>
            </Grid.Item>
          </Grid>
          {hydratedResourceData.image && (
            <img
              src={hydratedResourceData.image}
              alt={hydratedResourceData.name}
              width="70"
              height="70"
            />
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
