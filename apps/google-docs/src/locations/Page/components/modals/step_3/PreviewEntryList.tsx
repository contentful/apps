import { Box, Flex, Text, Checkbox } from '@contentful/f36-components';
import { PreviewEntry } from './PreviewModal';
import tokens from '@contentful/f36-tokens';

const MAX_TITLE_LENGTH = 60;

const truncateTitle = (title: string) => {
  return title.length > MAX_TITLE_LENGTH ? title.substring(0, MAX_TITLE_LENGTH) + '...' : title;
};

export const PreviewEntryList = ({ previewEntries }: { previewEntries: PreviewEntry[] }) => {
  return (
    <>
      {previewEntries.map((previewEntry, index) => {
        const truncatedTitle = truncateTitle(previewEntry.title);

        return (
          <Box
            key={index}
            style={{
              border: `1px solid ${tokens.gray300}`,
              borderRadius: tokens.borderRadiusMedium,
              padding: tokens.spacingS,
              marginBottom: tokens.spacingS,
            }}>
            <Flex alignItems="center" gap="spacingXs">
              <Text fontWeight="fontWeightMedium" fontSize="fontSizeM" fontColor="gray900">
                {truncatedTitle}
              </Text>
              <Text
                fontWeight="fontWeightMedium"
                fontSize="fontSizeM"
                fontColor="gray500"
                as="span">
                ({previewEntry.contentTypeName})
              </Text>
            </Flex>
          </Box>
        );
      })}
    </>
  );
};
