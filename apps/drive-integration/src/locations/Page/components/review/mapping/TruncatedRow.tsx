import { Box, Text, Tooltip } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { truncateEnd } from '../../../../../utils/utils';

const valueContainerStyle = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
} as const;

export interface TruncatedRowProps {
  label: string;
  value: string;
  secondaryValue?: string;
  tooltipValue?: string;
  isTruncated?: boolean;
  maxLength?: number;
}

export const TruncatedRow = ({
  label,
  value,
  secondaryValue,
  tooltipValue,
  isTruncated,
  maxLength,
}: TruncatedRowProps) => {
  const truncated = maxLength === undefined ? truncateEnd(value) : truncateEnd(value, maxLength);
  const shouldShowTooltip = isTruncated ?? truncated !== value;
  const tooltipContentValue =
    tooltipValue ?? (secondaryValue ? `${value}${secondaryValue}` : value);

  return (
    <Text as="p" marginBottom="none" fontSize="fontSizeS" lineHeight="lineHeightS">
      <Text
        as="span"
        fontColor="gray600"
        marginRight="spacingXs"
        fontSize="fontSizeS"
        lineHeight="lineHeightS">
        {label}:
      </Text>
      <Text
        as="span"
        fontWeight="fontWeightDemiBold"
        fontSize="fontSizeS"
        lineHeight="lineHeightS"
        style={valueContainerStyle}>
        <Tooltip
          content={`${label}: ${tooltipContentValue}`}
          placement="top"
          isDisabled={!shouldShowTooltip}>
          <Box as="span">
            {truncated}
            {secondaryValue ? (
              <Box as="span" style={{ color: tokens.gray600 }}>
                {secondaryValue}
              </Box>
            ) : null}
          </Box>
        </Tooltip>
      </Text>
    </Text>
  );
};
