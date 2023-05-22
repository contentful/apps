import { Badge, Box, Card, Flex, Grid, Text } from '@contentful/f36-components';
import { useContext, useState } from 'react';
import ResourceCardRawData from './ResourceCardRawData';
import tokens from '@contentful/f36-tokens';
import ResourceCardMenu from './ResourceCardMenu';
import MissingResourceCard from './MissingResourceCard';
import { useDebounce } from 'usehooks-ts';
import useExternalResource from 'hooks/field/useExternalResource';
import { ExternalResourceLink } from 'types';
import { RenderDragFn } from '@contentful/field-editor-reference/dist/types';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';
import ResourceFieldContext from 'context/ResourceFieldContext';

export interface ResourceCardProps {
  value: ExternalResourceLink;
  index: number;
  total: number;
  dragHandleRender?: RenderDragFn;
}

const ResourceCard = (props: ResourceCardProps) => {
  const { value, index, total, dragHandleRender } = props;

  const { handleRemove, handleMoveToBottom, handleMoveToTop } = useContext(ResourceFieldContext);

  const debouncedValue = useDebounce(value, 300);
  const { externalResource, isLoading, error, errorMessage, errorStatus } =
    useExternalResource(debouncedValue);
  const [showJson, setShowJson] = useState<boolean>(false);

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
