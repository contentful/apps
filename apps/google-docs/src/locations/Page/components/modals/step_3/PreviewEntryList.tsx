import { Box, Flex, Text, Checkbox, Card } from '@contentful/f36-components';
import { PreviewEntry } from './PreviewModal';
import tokens from '@contentful/f36-tokens';

const MAX_TITLE_LENGTH = 60;

const truncateTitle = (title: string) => {
  return title.length > MAX_TITLE_LENGTH ? title.substring(0, MAX_TITLE_LENGTH) + '...' : title;
};

interface PreviewEntryListProps {
  previewEntries: PreviewEntry[];
  selectedIndices: Set<number>;
  onToggleEntry: (index: number) => void;
  onToggleAll: () => void;
}

export const PreviewEntryList = ({
  previewEntries,
  selectedIndices,
  onToggleEntry,
  onToggleAll,
}: PreviewEntryListProps) => {
  const allSelected = selectedIndices.size === previewEntries.length;
  const someSelected = selectedIndices.size > 0 && selectedIndices.size < previewEntries.length;

  return (
    <Box marginBottom="spacingM">
      <Box
        style={{
          padding: tokens.spacingS,
          marginBottom: tokens.spacingS,
        }}>
        <Checkbox
          isChecked={allSelected}
          isIndeterminate={someSelected}
          onChange={onToggleAll}
          id="select-all">
          <Text fontWeight="fontWeightMedium">Select all entries</Text>
        </Checkbox>
      </Box>

      {previewEntries.map((previewEntry, index) => {
        const truncatedTitle = truncateTitle(previewEntry.title);
        const isChecked = selectedIndices.has(index);

        return (
          <Card
            key={index}
            onClick={() => onToggleEntry(index)}
            style={{
              marginBottom: tokens.spacingS,
            }}>
            <Flex alignItems="center" gap="spacingS">
              <Checkbox
                isChecked={isChecked}
                onChange={() => onToggleEntry(index)}
                id={`entry-${index}`}
                onClick={(e) => onToggleEntry(index)}
              />
              <Flex alignItems="center" gap="spacingXs" style={{ flex: 1 }}>
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
            </Flex>
          </Card>
        );
      })}
    </Box>
  );
};
