import { Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { FIELD_TYPE_SEPARATOR, truncateFieldValue } from './mappingCardTextUtils';
import { TruncatedRow } from './TruncatedRow';

const CONTENT_TYPE_MAX_LENGTH = 30;

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

export const ViewMappingCard = ({
  card,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: ViewMappingCardProps) => {
  const { labelPart, typePart, fullValue, isTruncated } = truncateFieldValue(
    card.fieldName,
    card.fieldType
  );

  return (
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
      <TruncatedRow
        label="Content Type"
        value={card.contentTypeName}
        maxLength={CONTENT_TYPE_MAX_LENGTH}
      />
      <TruncatedRow label="Entry" value={card.entryName} />
      <TruncatedRow
        label="Field"
        value={labelPart}
        secondaryValue={typePart ? `${FIELD_TYPE_SEPARATOR}${typePart}` : undefined}
        tooltipValue={fullValue}
        isTruncated={isTruncated}
      />
    </Box>
  );
};
