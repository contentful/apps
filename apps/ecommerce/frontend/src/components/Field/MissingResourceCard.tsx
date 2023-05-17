import { Badge, Box, Card, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { RenderDragFn } from '@contentful/field-editor-reference/dist/types';
import { useState } from 'react';
import { ExternalResourceLink } from 'types';
import ResourceCardRawData from './ResourceCardRawData';
import ResourceCardMenu from './ResourceCardMenu';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';

interface MissingResourceCardProps {
  onRemove: Function;
  dragHandleRender?: RenderDragFn;
  error: string;
  errorMessage?: string;
  errorStatus?: number;
  index?: number;
  total?: number;
  isLoading?: boolean;
  value: string;
  onMoveToBottom?: Function;
  onMoveToTop?: Function;
}

const MissingResourceCard = (props: MissingResourceCardProps) => {
  const [showJson, setShowJson] = useState<boolean>(false);
  const resourceLink = JSON.parse(props.value) as ExternalResourceLink;
  const { resourceProvider, resourceType } = getResourceProviderAndType(resourceLink);

  return (
    <Card
      isLoading={props.isLoading}
      withDragHandle={!!props.dragHandleRender}
      dragHandleRender={props.dragHandleRender}
      padding="none"
      isHovered={false}>
      <Box paddingLeft="spacingM" style={{ borderBottom: `1px solid ${tokens.gray200}` }}>
        <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
          <Text fontColor="gray600" isWordBreak={true}>
            {resourceProvider} {resourceType}
          </Text>
          <Flex alignItems="center" isInline={true}>
            <Badge variant={props.errorStatus === 404 ? 'warning' : 'negative'}>
              {props.errorMessage}
            </Badge>
            <ResourceCardMenu
              onRemove={() => props.onRemove(props.index)}
              isDataVisible={showJson}
              onShowData={() => setShowJson(true)}
              onHideData={() => setShowJson(false)}
              index={props.index}
              total={props.total}
              onMoveToBottom={() => props.onMoveToBottom?.call(null, props.index)}
              onMoveToTop={() => props.onMoveToTop?.call(null, props.index)}
            />
          </Flex>
        </Flex>
      </Box>
      <Box padding="spacingM">
        <Text
          fontSize="fontSizeL"
          fontWeight="fontWeightDemiBold"
          lineHeight="lineHeightL"
          isWordBreak={true}>
          Resource is missing or inaccessible
        </Text>
        <ResourceCardRawData
          value={props.value}
          isVisible={showJson}
          onHide={() => setShowJson(false)}
        />
      </Box>
    </Card>
  );
};

export default MissingResourceCard;
