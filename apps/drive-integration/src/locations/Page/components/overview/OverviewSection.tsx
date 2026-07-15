import { useMemo } from 'react';
import { Box, Button, Checkbox, Flex, Note, Paragraph, Text } from '@contentful/f36-components';
import { LightbulbIcon } from '@contentful/f36-icons';
import type { MappingReviewSuspendPayload, ValidationFinding } from '@types';
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
  areEntrySelectionsDisabled?: boolean;
  /** Whether any block-severity findings exist; drives the acknowledgement Note visibility. */
  hasBlockFindings?: boolean;
  /** Called with `true` when the user checks the block-findings acknowledgement. */
  onBlockFindingsAcknowledged?: (acknowledged: boolean) => void;
  /** Whether the user has acknowledged block findings. */
  blockFindingsAcknowledged?: boolean;
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
  areEntrySelectionsDisabled = false,
  hasBlockFindings = false,
  onBlockFindingsAcknowledged,
  blockFindingsAcknowledged = false,
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

  const findingsByEntryIndex = useMemo((): ReadonlyMap<number, ValidationFinding[]> => {
    const map = new Map<number, ValidationFinding[]>();
    for (const finding of payload.validationFindings ?? []) {
      if (finding.entryIndex === undefined) continue;
      const list = map.get(finding.entryIndex) ?? [];
      list.push(finding);
      map.set(finding.entryIndex, list);
    }
    return map;
  }, [payload.validationFindings]);

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
              Select which entries you'd like to create.
            </Paragraph>
          </Flex>

          <Splitter />

          {hasBlockFindings && (
            <Note variant="negative">
              <Flex flexDirection="column" gap="spacingXs">
                <Text>
                  Some entries have issues that may prevent the content from being created
                  correctly. Review the highlighted entries before proceeding.
                </Text>
                <Checkbox
                  isChecked={blockFindingsAcknowledged}
                  onChange={(event) => onBlockFindingsAcknowledged?.(event.target.checked)}>
                  I have reviewed the issues and want to proceed
                </Checkbox>
              </Flex>
            </Note>
          )}

          <Flex justifyContent="space-between" alignItems="center" paddingBottom="none">
            <Flex flexDirection="column" gap="spacingXs">
              <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeL">
                Entries
              </Text>
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
                findingsByEntryIndex={findingsByEntryIndex}
              />
            </Box>
          )}
        </Flex>
      </Box>
    </>
  );
};

export default OverviewSection;
