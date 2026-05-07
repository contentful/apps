import { useMemo } from 'react';
import { Box, Button, Flex, Note, Paragraph, Text } from '@contentful/f36-components';
import { LightbulbIcon } from '@contentful/f36-icons';
import type { MappingReviewSuspendPayload } from '@types';
import { buildEntryListFromEntryBlockGraph } from '../../../../utils/overviewEntryList';
import { OverviewEntryList } from './OverviewEntryList';
import { overviewSectionBox, overviewSectionBoxScrollable } from './OverviewSection.styles';
import Splitter from '../mainpage/Splitter';

interface OverviewProps {
  payload: MappingReviewSuspendPayload;
  selectedEntryIndex: number | null;
  selectedEntryKeys: ReadonlySet<string>;
  onSelectEntryIndex: (index: number) => void;
  onToggleEntrySelection: (entryKey: string, isSelected: boolean) => void;
  ctaLabel: string;
  onCtaClick: () => void;
  isCtaLoading?: boolean;
  isCtaDisabled?: boolean;
  selectedEntryCount: number;
  areEntrySelectionsDisabled?: boolean;
}

const OverviewSection = ({
  payload,
  selectedEntryIndex,
  selectedEntryKeys,
  onSelectEntryIndex,
  onToggleEntrySelection,
  ctaLabel,
  onCtaClick,
  isCtaLoading = false,
  isCtaDisabled = false,
  selectedEntryCount,
  areEntrySelectionsDisabled = false,
}: OverviewProps) => {
  const totalEntryCount = payload.entryBlockGraph.entries.length;
  const entrySelectionCountLabel =
    totalEntryCount === 1
      ? `${selectedEntryCount} of 1 entry selected`
      : `${selectedEntryCount} of ${totalEntryCount} entries selected`;
  const entryRows = useMemo(
    () =>
      buildEntryListFromEntryBlockGraph(
        payload.entryBlockGraph.entries,
        payload.contentTypes,
        payload.referenceGraph.edges
      ),
    [payload.entryBlockGraph.entries, payload.contentTypes, payload.referenceGraph.edges]
  );

  return (
    <>
      <Box padding="spacingL" className={overviewSectionBox}>
        <Flex flexDirection="column" gap="spacingM">
          <Flex flexDirection="column" gap="spacingXs">
            <Flex alignItems="center" gap="spacingXs">
              <LightbulbIcon size="small" />
              <Text fontWeight="fontWeightDemiBold">How to use this app</Text>
            </Flex>
            <Paragraph marginBottom="none">
              Review your content and associated entries below. Highlight text to make adjustments.
              Create entries when you are complete.
            </Paragraph>
          </Flex>

          <Splitter />

          <Flex justifyContent="space-between" alignItems="center" paddingBottom="none">
            <Flex flexDirection="column" gap="spacingXs">
              <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeL">
                Entries
              </Text>
              <Text fontSize="fontSizeM">Click row to view content by entry below.</Text>
            </Flex>

            <Flex alignItems="center" gap="spacingS">
              <Button
                variant="primary"
                onClick={onCtaClick}
                isLoading={isCtaLoading}
                isDisabled={isCtaLoading || isCtaDisabled}>
                {ctaLabel}
              </Button>
            </Flex>
          </Flex>
          <Text fontSize="fontSizeS" fontColor="gray600">
            {entrySelectionCountLabel}
          </Text>

          {entryRows.length === 0 ? (
            <Note variant="neutral">
              No entries were found in this preview. When the document is parsed successfully,
              entries to create will appear here.
            </Note>
          ) : (
            <Box className={overviewSectionBoxScrollable}>
              <OverviewEntryList
                rows={entryRows}
                selectedEntryIndex={selectedEntryIndex}
                selectedEntryKeys={selectedEntryKeys}
                onSelect={onSelectEntryIndex}
                onToggleEntrySelection={onToggleEntrySelection}
                areEntrySelectionsDisabled={areEntrySelectionsDisabled}
              />
            </Box>
          )}
        </Flex>
      </Box>
    </>
  );
};

export default OverviewSection;
