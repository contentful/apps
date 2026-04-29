import { type Ref } from 'react';
import { Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { FIELD_TYPE_SEPARATOR, truncateFieldValue } from './mappingCardTextUtils';
import { TruncatedRow } from './TruncatedRow';

export interface MappingCardData {
  key: string;
  fieldName: string;
  fieldType: string;
}

interface MappingCardProps {
  card: MappingCardData;
  top: number;
  wrapperRef: Ref<HTMLDivElement>;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MappingCard = ({
  card,
  top,
  wrapperRef,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: MappingCardProps) => {
  const { fieldName, fieldType } = card;
  const { labelPart, typePart, fullValue, isTruncated } = truncateFieldValue(fieldName, fieldType);
  return (
    <Box
      ref={wrapperRef}
      data-testid={`mapping-card-${card.key}`}
      data-hovered={isHovered ? 'true' : 'false'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        insetInlineStart: 0,
        insetInlineEnd: 0,
        top,
        border: `${isHovered ? 2 : 1}px solid ${isHovered ? tokens.green600 : tokens.green500}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacing2Xs,
        backgroundColor: tokens.green100,
        transition: 'border-color 120ms ease, border-width 120ms ease',
      }}>
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
