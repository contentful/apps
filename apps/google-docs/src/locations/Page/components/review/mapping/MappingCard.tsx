import { type Ref } from 'react';
import { Box, Text, Tooltip } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

export interface MappingCardData {
  key: string;
  contentTypeName: string;
  fieldName: string;
  fieldType: string;
  displayLabel: string;
  entryLabel: string;
}

interface MappingCardProps {
  card: MappingCardData;
  top: number;
  wrapperRef: Ref<HTMLDivElement>;
  showContentTypeName?: boolean;
  useStaticLayout?: boolean;
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
  showContentTypeName = false,
  useStaticLayout = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: MappingCardProps) => {
  const { contentTypeName, displayLabel, fieldType, entryLabel } = card;
  const fullValue = `${displayLabel}${FIELD_TYPE_SEPARATOR}${fieldType}`;
  const truncatedValue = truncate(fullValue, MAX_VALUE_LENGTH);
  const truncatedEntryLabel = truncate(entryLabel, MAX_VALUE_LENGTH);
  const separatorIndex = truncatedValue.indexOf(FIELD_TYPE_SEPARATOR);
  const hasTypePart = separatorIndex !== -1;
  const labelPart = hasTypePart ? truncatedValue.slice(0, separatorIndex) : truncatedValue;
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
        position: useStaticLayout ? 'relative' : 'absolute',
        insetInlineStart: useStaticLayout ? undefined : 0,
        insetInlineEnd: useStaticLayout ? undefined : 0,
        top: useStaticLayout ? undefined : top,
        border: `1px solid ${isHovered ? tokens.green600 : tokens.green500}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacing2Xs,
        backgroundColor: showContentTypeName ? tokens.colorWhite : tokens.green100,
        boxShadow: isHovered ? `inset 0 0 0 1px ${tokens.green600}` : undefined,
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
      }}>
      {showContentTypeName ? (
        <Box marginBottom="spacing2Xs">
          <Text as="span" fontColor="gray600" style={labelTextStyle} marginRight="spacingXs">
            Content type:
          </Text>
          <Text as="span" fontWeight="fontWeightDemiBold" style={valueTextStyle}>
            {contentTypeName}
          </Text>
          <Box marginTop="spacing2Xs">
            <Text as="span" fontColor="gray600" style={labelTextStyle} marginRight="spacingXs">
              Entry:
            </Text>
            <Text as="span" fontWeight="fontWeightDemiBold" style={valueTextStyle}>
              <Tooltip
                content={`Entry: ${entryLabel}`}
                placement="top"
                isDisabled={truncatedEntryLabel === entryLabel}>
                <Box as="span">{truncatedEntryLabel}</Box>
              </Tooltip>
            </Text>
          </Box>
        </Box>
      ) : null}
      <Text as="span" fontColor="gray600" style={labelTextStyle} marginRight="spacingXs">
        Field:
      </Text>
      <Text as="span" fontWeight="fontWeightDemiBold" style={valueTextStyle}>
        <Tooltip
          content={`Field: ${fullValue}`}
          placement="top"
          isDisabled={truncatedValue === fullValue}>
          <Box as="span">
            {labelPart}
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
