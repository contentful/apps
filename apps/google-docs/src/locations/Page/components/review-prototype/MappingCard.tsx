import { Box, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

export interface MappingCardData {
  key: string;
  fieldName: string;
  fieldType: string;
}

interface MappingCardProps {
  card: MappingCardData;
}

const labelTextStyle = {
  fontSize: tokens.fontSizeS,
  lineHeight: tokens.lineHeightS,
};

const valueTextStyle = {
  fontSize: tokens.fontSizeS,
  lineHeight: tokens.lineHeightS,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

export const MappingCard = ({ card }: MappingCardProps) => (
  <Box
    data-testid={`mapping-card-${card.key}`}
    style={{
      border: `1px solid ${tokens.green500}`,
      borderRadius: tokens.borderRadiusMedium,
      padding: tokens.spacing2Xs,
      backgroundColor: tokens.green100,
    }}>
    <Text as="span" fontColor="gray600" style={labelTextStyle} marginRight="spacingXs">
      Field:
    </Text>
    <Text
      as="span"
      fontWeight="fontWeightDemiBold"
      title={`${card.fieldName} (${card.fieldType})`}
      style={valueTextStyle}>
      {card.fieldName}

      <Box as="span" style={{ color: tokens.gray600 }}>
        {' | '}
        {card.fieldType}
      </Box>
    </Text>
  </Box>
);
