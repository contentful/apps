import { Box, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

export interface MappingCardData {
  key: string;
  contentTypeName: string;
  entryName: string;
  fieldName: string;
}

interface MappingCardProps {
  card: MappingCardData;
}

const labelTextStyle = {
  fontSize: tokens.fontSizeS,
};

const valueTextStyle = {
  fontSize: tokens.fontSizeS,
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
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: '84px minmax(0, 1fr)',
        alignItems: 'start',
      }}>
      <Text as="span" fontColor="gray600" style={labelTextStyle}>
        Content type
      </Text>
      <Text
        as="span"
        fontWeight="fontWeightMedium"
        title={card.contentTypeName}
        style={valueTextStyle}>
        {card.contentTypeName}
      </Text>

      <Text as="span" fontColor="gray600" style={labelTextStyle}>
        Entry name
      </Text>
      <Text as="span" fontWeight="fontWeightMedium" title={card.entryName} style={valueTextStyle}>
        {card.entryName}
      </Text>

      <Text as="span" fontColor="gray600" style={labelTextStyle}>
        Field
      </Text>
      <Text as="span" fontWeight="fontWeightMedium" title={card.fieldName} style={valueTextStyle}>
        {card.fieldName}
      </Text>
      <Text as="span" fontColor="gray600" style={labelTextStyle}></Text>
    </Box>
  </Box>
);
