import { type Ref } from 'react';
import { Box, Text, Tooltip } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

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

const labelTextStyle = {
  fontSize: tokens.fontSizeS,
  lineHeight: tokens.lineHeightS,
};

const MAX_VALUE_LENGTH = 35;
const FIELD_TYPE_SEPARATOR = ' | ';

const valueTextStyle = {
  fontSize: tokens.fontSizeS,
  lineHeight: tokens.lineHeightS,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
} as const;

export const truncate = (str: string, maxLength: number) =>
  str.length > maxLength ? str.slice(0, maxLength) + ' ...' : str;

export const MappingCard = ({
  card,
  top,
  wrapperRef,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: MappingCardProps) => {
  const { fieldName, fieldType } = card;

  const fullValue = `${fieldName}${FIELD_TYPE_SEPARATOR}${fieldType}`;
  const truncatedValue = truncate(fullValue, MAX_VALUE_LENGTH);
  const separatorIndex = truncatedValue.indexOf(FIELD_TYPE_SEPARATOR);
  const hasTypePart = separatorIndex !== -1;
  const namePart = hasTypePart ? fieldName : truncatedValue;
  const typePart = hasTypePart
    ? truncatedValue.slice(separatorIndex + FIELD_TYPE_SEPARATOR.length)
    : null;

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
      <Text as="span" fontColor="gray600" style={labelTextStyle} marginRight="spacingXs">
        Field:
      </Text>
      <Text as="span" fontWeight="fontWeightDemiBold" style={valueTextStyle}>
        <Tooltip
          content={`Field: ${fullValue}`}
          placement="top"
          isDisabled={truncatedValue === fullValue}>
          <Box as="span">
            {namePart}
            {typePart ? (
              <Box as="span" style={{ color: tokens.gray600 }}>
                {FIELD_TYPE_SEPARATOR}
                {typePart}
              </Box>
            ) : null}
          </Box>
        </Tooltip>
      </Text>
    </Box>
  );
};
