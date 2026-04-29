import { Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { FIELD_TYPE_SEPARATOR, truncateFieldPart } from './mappingCardText';
import { TruncatedRow } from './TruncatedRow';

const CONTENT_TYPE_MAX_LENGTH = 30;

export interface ViewMappingCardData {
  key: string;
  contentTypeName: string;
  entryName: string;
  fieldName: string;
  fieldType: string;
}

interface ViewMappingCardProps {
  card: ViewMappingCardData;
}

export const ViewMappingCard = ({ card }: ViewMappingCardProps) => {
  const { labelPart, typePart, fullValue, isTruncated } = truncateFieldPart(
    card.fieldName,
    card.fieldType
  );

  return (
    <Box
      data-testid={`view-mapping-card-${card.key}`}
      style={{
        border: `1px solid ${tokens.green500}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacing2Xs,
        backgroundColor: tokens.green100,
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
