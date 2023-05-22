import { Badge, Box, Card, Flex, Text } from '@contentful/f36-components';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';
import { useContext, useState } from 'react';
import ResourceCardMenu from './ResourceCardMenu';
import ResourceCardRawData from './ResourceCardRawData';
import ResourceFieldContext from 'context/ResourceFieldContext';
import tokens from '@contentful/f36-tokens';
import type { ResourceCardProps } from './ResourceCard';

interface MissingResourceCardProps extends ResourceCardProps {
  error: string;
  errorMessage?: string;
  errorStatus?: number;
  isLoading: boolean;
}

const MissingResourceCard = (props: MissingResourceCardProps) => {
  const { value, isLoading, errorMessage, errorStatus, index, total, dragHandleRender } = props;
  const { handleRemove, handleMoveToBottom, handleMoveToTop } = useContext(ResourceFieldContext);

  const [showJson, setShowJson] = useState<boolean>(false);
  const { resourceProvider, resourceType } = getResourceProviderAndType(value);

  return (
    <Card
      isLoading={isLoading}
      withDragHandle={!!dragHandleRender}
      dragHandleRender={dragHandleRender}
      padding="none"
      isHovered={false}>
      <Box paddingLeft="spacingM" style={{ borderBottom: `1px solid ${tokens.gray200}` }}>
        <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
          <Text fontColor="gray600" isWordBreak={true}>
            {resourceProvider} {resourceType}
          </Text>
          <Flex alignItems="center" isInline={true}>
            <Badge variant={errorStatus === 404 ? 'warning' : 'negative'}>{errorMessage}</Badge>
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
        <Text
          fontSize="fontSizeL"
          fontWeight="fontWeightDemiBold"
          lineHeight="lineHeightL"
          isWordBreak={true}>
          Resource is missing or inaccessible
        </Text>
        <ResourceCardRawData
          value={JSON.stringify(value)}
          isVisible={showJson}
          onHide={() => setShowJson(false)}
        />
      </Box>
    </Card>
  );
};

export default MissingResourceCard;
