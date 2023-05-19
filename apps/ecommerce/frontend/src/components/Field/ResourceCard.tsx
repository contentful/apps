import { Badge, Box, Card, Flex, Grid, Text } from '@contentful/f36-components';
import { useState } from 'react';
import ResourceCardRawData from './ResourceCardRawData';
import tokens from '@contentful/f36-tokens';
import ResourceCardMenu from './ResourceCardMenu';
import MissingResourceCard from './MissingResourceCard';
import { useDebounce } from 'usehooks-ts';
import useExternalResource from 'hooks/field/useExternalResource';
import { ExternalResource, ExternalResourceLink } from 'types';
import { RenderDragFn } from '@contentful/field-editor-reference/dist/types';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';

interface Props {
  value: ExternalResourceLink;
  data?: ExternalResource;
  index?: number;
  total?: number;
  onRemove: Function;
  dragHandleRender?: RenderDragFn;
  onMoveToTop?: Function;
  onMoveToBottom?: Function;
}

const ResourceCard = (props: Props) => {
  const { value, index, total, onRemove, dragHandleRender, onMoveToTop, onMoveToBottom } = props;

  const debouncedValue = useDebounce(value, 300);
  const { externalResource, isLoading, error, errorMessage, errorStatus } =
    useExternalResource(debouncedValue);
  const [showJson, setShowJson] = useState<boolean>(false);

  if (error) {
    return (
      <MissingResourceCard
        index={index}
        total={total}
        onRemove={onRemove}
        onMoveToBottom={onMoveToBottom}
        onMoveToTop={onMoveToTop}
        isLoading={isLoading}
        error={error}
        value={JSON.stringify(value)}
        errorMessage={errorMessage}
        errorStatus={errorStatus}
        dragHandleRender={dragHandleRender}
      />
    );
  }

  const { resourceProvider, resourceType } = getResourceProviderAndType(value);

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
              onRemove={() => onRemove(index)}
              isDataVisible={showJson}
              onShowData={() => setShowJson(true)}
              onHideData={() => setShowJson(false)}
              index={index}
              total={total}
              onMoveToBottom={() => onMoveToBottom?.call(null, index)}
              onMoveToTop={() => onMoveToTop?.call(null, index)}
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
