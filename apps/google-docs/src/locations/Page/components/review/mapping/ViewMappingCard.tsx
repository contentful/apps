import { Box, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

export interface ViewMappingCardData {
  key: string;
  mappingKeys: string[];
  contentTypeName: string;
  entryName: string;
  fieldName: string;
  fieldType: string;
}

interface ViewMappingCardProps {
  card: ViewMappingCardData;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const rowTextStyle = {
  fontSize: tokens.fontSizeS,
  lineHeight: tokens.lineHeightS,
} as const;

const truncatedValueStyle = {
  fontSize: tokens.fontSizeS,
  lineHeight: tokens.lineHeightS,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

export const ViewMappingCard = ({
  card,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: ViewMappingCardProps) => (
  <Box
    data-testid={`view-mapping-card-${card.key}`}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{
      border: `${isHovered ? 2 : 1}px solid ${isHovered ? tokens.green600 : tokens.green500}`,
      borderRadius: tokens.borderRadiusMedium,
      padding: tokens.spacing2Xs,
      backgroundColor: tokens.green100,
      transition: 'border-color 120ms ease, border-width 120ms ease',
      cursor: 'default',
    }}>
    <Text as="p" marginBottom="none" style={rowTextStyle}>
      <Text as="span" fontColor="gray600" marginRight="spacingXs" style={rowTextStyle}>
        Content Type:
      </Text>
      <Text as="span" fontWeight="fontWeightDemiBold" style={truncatedValueStyle}>
        {card.contentTypeName}
      </Text>
    </Text>
    <Text as="p" marginBottom="none" style={rowTextStyle}>
      <Text as="span" fontColor="gray600" marginRight="spacingXs" style={rowTextStyle}>
        Entry:
      </Text>
      <Text as="span" fontWeight="fontWeightDemiBold" style={truncatedValueStyle}>
        {card.entryName}
      </Text>
    </Text>
    <Text as="p" marginBottom="none" style={rowTextStyle}>
      <Text as="span" fontColor="gray600" marginRight="spacingXs" style={rowTextStyle}>
        Field:
      </Text>
      <Text as="span" fontWeight="fontWeightDemiBold" style={truncatedValueStyle}>
        {card.fieldName}
        <Box as="span" style={{ color: tokens.gray600 }}>
          {' | '}
          {card.fieldType}
        </Box>
      </Text>
    </Text>
  </Box>
);
