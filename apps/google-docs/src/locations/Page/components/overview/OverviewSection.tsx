import { useMemo } from 'react';
import { Box, Button, Flex, Note, Paragraph, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { EyeIcon, LightbulbIcon, PencilSimpleIcon } from '@contentful/f36-icons';
import type { MappingReviewSuspendPayload } from '@types';
import { buildEntryListFromEntryBlockGraph } from '../../../../utils/overviewEntryList';
import { OverviewEntryList } from './OverviewEntryList';
import { overviewSectionBox, overviewSectionBoxScrollable } from './OverviewSection.styles';
import Splitter from '../mainpage/Splitter';

interface OverviewProps {
  payload: MappingReviewSuspendPayload;
  selectedEntryIndex: number | null;
  onSelectEntryIndex: (index: number) => void;
  onViewAllMappings: () => void;
  onEditMode: () => void;
  isViewingAllMappings: boolean;
  canEditMappings?: boolean;
  ctaLabel: string;
  onCtaClick: () => void;
  isCtaLoading?: boolean;
}

const OverviewSection = ({
  payload,
  selectedEntryIndex,
  onSelectEntryIndex,
  onViewAllMappings,
  onEditMode,
  isViewingAllMappings,
  canEditMappings = true,
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
  const areModeButtonsDisabled = isCtaLoading || entryRows.length === 0;

  const toggleButtonStyle = (isActive: boolean, isFirst: boolean, isLast: boolean) => ({
    minHeight: '38px',
    minWidth: '136px',
    paddingInline: tokens.spacingM,
    border: 'none',
    borderInlineEnd: isLast ? 'none' : `1px solid ${tokens.gray200}`,
    borderRadius: isFirst
      ? `${tokens.borderRadiusMedium} 0 0 ${tokens.borderRadiusMedium}`
      : isLast
      ? `0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0`
      : 0,
    backgroundColor: isActive ? tokens.colorWhite : 'transparent',
    color: isActive ? tokens.gray900 : tokens.gray700,
    boxShadow: isActive
      ? `inset 0 0 0 1px ${tokens.gray200}, 0 1px 2px rgba(17, 24, 39, 0.06)`
      : 'none',
    fontWeight: isActive ? tokens.fontWeightDemiBold : tokens.fontWeightMedium,
    justifyContent: 'center',
    gap: tokens.spacing2Xs,
  });

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

            <Flex alignItems="center" gap="spacingXs">
              <Box
                role="group"
                aria-label="Review mode"
                style={{
                  display: 'inline-flex',
                  alignItems: 'stretch',
                  border: `1px solid ${tokens.gray300}`,
                  borderRadius: tokens.borderRadiusMedium,
                  backgroundColor: tokens.gray100,
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px rgba(17, 24, 39, 0.05)',
                }}>
                <Button
                  variant="transparent"
                  startIcon={<EyeIcon />}
                  size="small"
                  aria-pressed={isViewingAllMappings}
                  onClick={onViewAllMappings}
                  isDisabled={areModeButtonsDisabled}
                  style={toggleButtonStyle(isViewingAllMappings, true, !canEditMappings)}>
                  View only
                </Button>
                {canEditMappings ? (
                  <Button
                    variant="transparent"
                    startIcon={<PencilSimpleIcon />}
                    size="small"
                    aria-pressed={!isViewingAllMappings}
                    onClick={onEditMode}
                    isDisabled={areModeButtonsDisabled}
                    style={toggleButtonStyle(!isViewingAllMappings, false, true)}>
                    Edit mode
                  </Button>
                ) : null}
              </Box>
              <Button
                variant="primary"
                onClick={onCtaClick}
                isLoading={isCtaLoading}
                isDisabled={isCtaLoading}>
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
