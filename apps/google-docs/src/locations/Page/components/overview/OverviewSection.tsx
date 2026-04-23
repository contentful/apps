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
  selectedEntryIndex: number;
  onSelectEntryIndex: (index: number) => void;
  ctaLabel: string;
  onCtaClick: () => void;
  isCtaLoading?: boolean;
}

const OverviewSection = ({
  payload,
  selectedEntryIndex,
  onSelectEntryIndex,
  ctaLabel,
  onCtaClick,
  isCtaLoading = false,
}: OverviewProps) => {
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

            <Button
              variant="primary"
              onClick={onCtaClick}
              isLoading={isCtaLoading}
              isDisabled={isCtaLoading}>
              {ctaLabel}
            </Button>
          </Flex>

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
                onSelect={onSelectEntryIndex}
              />
            </Box>
          )}
        </Flex>
      </Box>
    </>
  );
};

export default OverviewSection;
