import { Badge, Box, Flex, Text } from '@contentful/f36-components';
import * as PhosphorIcons from '@phosphor-icons/react';
import type { IconFieldValue } from '../../types/icon';
import { formatPositionLabel, ICON_WEIGHT_LABELS } from '../../types/icon';

interface IconPreviewProps {
  value: IconFieldValue;
}

export function IconPreview({ value }: IconPreviewProps) {
  const IconComponent = (
    PhosphorIcons as Record<string, React.ComponentType<{ size?: number; weight?: string }>>
  )[value.componentName];

  return (
    <Box
      padding="spacingM"
      style={{
        border: '1px solid #cfd9e5',
        borderRadius: '8px',
        backgroundColor: '#f7f9fa',
      }}>
      <Flex alignItems="center" gap="spacingM">
        <Box
          style={{
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #cfd9e5',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            flexShrink: 0,
          }}>
          {IconComponent ? (
            <IconComponent size={32} weight={value.weight} />
          ) : (
            <Text fontColor="gray500">?</Text>
          )}
        </Box>
        <Flex flexDirection="column" gap="spacing2Xs" style={{ minWidth: 0 }}>
          <Text fontWeight="fontWeightDemiBold">{value.name}</Text>
          <Text fontColor="gray600" fontSize="fontSizeS">
            {value.componentName}
          </Text>
        </Flex>
      </Flex>
      <Flex gap="spacingS" flexWrap="wrap" marginTop="spacingM">
        <Badge variant="secondary">Style: {ICON_WEIGHT_LABELS[value.weight]}</Badge>
        <Badge variant="secondary">Position: {formatPositionLabel(value.position)}</Badge>
      </Flex>
    </Box>
  );
}
