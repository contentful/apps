import { useMemo, useState } from 'react';
import { Box, Button, Flex, Note, Paragraph, Text } from '@contentful/f36-components';
import { LightbulbIcon } from '@contentful/f36-icons';
import { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps } from 'contentful-management';
import type { MappingReviewSuspendPayload, CompletedWorkflowPayload } from '@types';
import {
  buildEntryListFromEntryBlockGraph,
  ContentTypeDisplayInfoMap,
} from '../../../../utils/overviewEntryList';
import { createEntriesFromPreviewPayload } from '../../../../services/entryService';
import { OverviewEntryList } from './OverviewEntryList';
import { overviewSectionBox, overviewSectionBoxScrollable } from './OverviewSection.styles';
import { SummaryModal } from '../modals/SummaryModal';
import { ErrorModal } from '../modals/ErrorModal';
import Splitter from '../mainpage/Splitter';

interface OverviewProps {
  sdk: PageAppSDK;
  payload: MappingReviewSuspendPayload;
  selectedEntryIndex: number;
  onSelectEntryIndex: (index: number) => void;
  onCreateEntries: () => Promise<CompletedWorkflowPayload | null>;
  onReturnToMainPage: () => void;
}

const OverviewSection = ({
  sdk,
  payload,
  selectedEntryIndex,
  onSelectEntryIndex,
  onCreateEntries,
  onReturnToMainPage,
}: OverviewProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [summaryEntries, setSummaryEntries] = useState<EntryProps[] | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const entryRows = useMemo(
    () =>
      buildEntryListFromEntryBlockGraph(
        payload.entryBlockGraph.entries,
        payload.contentTypes,
        payload.referenceGraph.edges
      ),
    [payload.entryBlockGraph.entries, payload.contentTypes, payload.referenceGraph.edges]
  );

  const contentTypeDisplayInfoMap = useMemo<ContentTypeDisplayInfoMap>(() => {
    const map = new Map<string, { name: string; displayField?: string }>();
    for (const ct of payload.contentTypes) {
      map.set(ct.sys.id, {
        name: ct.name ?? ct.sys.id,
        displayField: ct.displayField,
      });
    }
    return map;
  }, [payload.contentTypes]);

  const handleCreateEntries = async () => {
    console.log('[create-entries] creating entries, calling onCreateEntries');
    setIsCreating(true);

    try {
      const previewPayload = await onCreateEntries();

      if (!previewPayload) {
        return;
      }
      const result = await createEntriesFromPreviewPayload(sdk, previewPayload);

      setSummaryEntries(result.createdEntries);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating entries.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleSummaryDone = () => {
    setSummaryEntries(null);
    onReturnToMainPage();
  };

  return (
    <>
      <Box padding="spacingL" className={overviewSectionBox}>
        <Flex flexDirection="column" gap="spacingS">
          <Flex flexDirection="column" gap="spacingXs">
            <Flex alignItems="center" gap="spacingXs">
              <LightbulbIcon size="small" />
              <Text fontWeight="fontWeightDemiBold">How to use this app</Text>
            </Flex>
            <Paragraph marginBottom="none" fontColor="gray600">
              Review your content and associated entries below. Highlight text to make adjustments.
              Select which entries you&apos;d like to create.
            </Paragraph>
          </Flex>

          <Splitter />

          <Flex justifyContent="space-between" alignItems="center">
            <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeL">
              Entries
            </Text>
            <Button
              variant="primary"
              onClick={() => void handleCreateEntries()}
              isLoading={isCreating}>
              Create entries
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

      <SummaryModal
        isOpen={summaryEntries !== null}
        sdk={sdk}
        entries={summaryEntries ?? []}
        contentTypeDisplayInfoMap={contentTypeDisplayInfoMap}
        defaultLocale={sdk.locales.default}
        onDone={handleSummaryDone}
      />

      <ErrorModal
        isOpen={createError !== null}
        title="Failed to create entries"
        message={createError ?? ''}
        onClose={() => setCreateError(null)}
      />
    </>
  );
};

export default OverviewSection;
