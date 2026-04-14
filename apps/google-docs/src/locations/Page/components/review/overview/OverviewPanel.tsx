import { Box, Card, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { DocumentOutlineOverviewEntry } from './buildOverviewEntries';

interface OverviewPanelProps {
  overviewEntries: DocumentOutlineOverviewEntry[];
  selectedEntryIndex: number | null;
  onSelectEntryIndex: (index: number | null) => void;
}

export const OverviewPanel = ({
  overviewEntries,
  selectedEntryIndex,
  onSelectEntryIndex,
}: OverviewPanelProps) => (
  <Card padding="default" style={{ border: `1px solid ${tokens.gray300}` }}>
    <Flex flexDirection="column" gap="spacingS">
      <Box>
        <Text fontWeight="fontWeightDemiBold">Overview</Text>
        <Text as="p" fontColor="gray600" marginBottom="none">
          Select an entry card to focus the document outline on that entry&apos;s mappings.
        </Text>
      </Box>

      <Flex gap="spacingS" flexWrap="wrap">
        <Box
          as="button"
          type="button"
          data-testid="entry-overview-card-all"
          aria-pressed={selectedEntryIndex === null}
          onClick={() => onSelectEntryIndex(null)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing2Xs,
            minWidth: 220,
            padding: tokens.spacingM,
            borderRadius: tokens.borderRadiusMedium,
            border: `1px solid ${selectedEntryIndex === null ? tokens.green500 : tokens.gray300}`,
            backgroundColor: selectedEntryIndex === null ? tokens.green100 : tokens.colorWhite,
            textAlign: 'left',
            cursor: 'pointer',
          }}>
          <Text fontWeight="fontWeightDemiBold">All mappings</Text>
          <Text as="span" fontColor="gray600">
            Show every mapped entry in the document outline.
          </Text>
        </Box>

        {overviewEntries.map((entry) => {
          const isSelected = selectedEntryIndex === entry.entryIndex;
          return (
            <Box
              as="button"
              key={entry.key}
              type="button"
              data-testid={`entry-overview-card-${entry.key}`}
              aria-pressed={isSelected}
              onClick={() => onSelectEntryIndex(entry.entryIndex)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing2Xs,
                minWidth: 220,
                padding: tokens.spacingM,
                borderRadius: tokens.borderRadiusMedium,
                border: `1px solid ${isSelected ? tokens.green500 : tokens.gray300}`,
                backgroundColor: isSelected ? tokens.green100 : tokens.colorWhite,
                textAlign: 'left',
                cursor: 'pointer',
              }}>
              <Text fontWeight="fontWeightDemiBold">{entry.title}</Text>
            </Box>
          );
        })}
      </Flex>
    </Flex>
  </Card>
);
