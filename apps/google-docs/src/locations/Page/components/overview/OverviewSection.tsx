import { useEffect, useMemo, useState } from 'react';
import { cx } from '@emotion/css';
import { Box, Button, Flex, Heading, Note, Paragraph } from '@contentful/f36-components';
import type { PreviewPayload } from '@types';
import {
  buildCheckboxEntryList,
  collectCheckboxEntryListRowIds,
  type ContentTypeDisplayInfoMap,
} from '../../../../utils/checkboxEntryList';
import { fetchContentTypesInfoByIds } from '../../../../services/contentTypeService';
import { CheckboxEntryList } from './CheckboxEntryList';
import { overviewSectionBox, overviewSectionBoxScrollable } from './OverviewSection.styles';
import { createEntriesFromPreviewPayload } from '../../../../services/entryService';
import { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps } from 'contentful-management';
import { SummaryModal } from '../modals/SummaryModal';

interface OverviewSectionProps {
  sdk: PageAppSDK;
  payload: PreviewPayload;
  onReturnToMainPage: () => void;
}

const OverviewSection = ({ sdk, payload, onReturnToMainPage }: OverviewSectionProps) => {
  const [contentTypeDisplayInfoMap, setContentTypeDisplayInfoMap] = useState<
    ContentTypeDisplayInfoMap | undefined
  >();
  const [selectedEntryTempIds, setSelectedEntryTempIds] = useState<Set<string>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [summaryEntries, setSummaryEntries] = useState<EntryProps[] | null>(null);

  useEffect(() => {
    const fetchContentTypesInfo = async () => {
      const contentTypeIds = [...new Set(payload.entries.map((entry) => entry.contentTypeId))]
        .filter((id): id is string => Boolean(id))
        .sort();
      if (contentTypeIds.length === 0) {
        setContentTypeDisplayInfoMap(undefined);
        return;
      }
      try {
        const map = await fetchContentTypesInfoByIds(sdk, contentTypeIds);
        setContentTypeDisplayInfoMap(map);
      } catch (error) {
        console.error('Failed to fetch content type names for overview labels:', error);
        setContentTypeDisplayInfoMap(undefined);
      }
    };

    fetchContentTypesInfo();
  }, [sdk, payload.entries]);

  const checkboxEntryRows = useMemo(
    () => buildCheckboxEntryList(payload, contentTypeDisplayInfoMap, sdk.locales.default),
    [payload, contentTypeDisplayInfoMap, sdk.locales.default]
  );

  useEffect(() => {
    setSelectedEntryTempIds(new Set(collectCheckboxEntryListRowIds(checkboxEntryRows)));
  }, [checkboxEntryRows]);

  const handleToggle = (id: string, checked: boolean) => {
    setSelectedEntryTempIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleCreateSelected = async () => {
    if (selectedEntryTempIds.size === 0) {
      return;
    }
    setIsCreating(true);
    try {
      const result = await createEntriesFromPreviewPayload(sdk, payload, selectedEntryTempIds);
      if (result.errors.length > 0) {
        sdk.notifier.error('Failed to create entries');
      } else {
        setSummaryEntries(result.createdEntries);
      }
    } catch {
      sdk.notifier.error('Failed to create entries');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSummaryDone = () => {
    setSummaryEntries(null);
    onReturnToMainPage();
  };

  return (
    <Box
      padding="spacingL"
      className={cx(
        overviewSectionBox,
        checkboxEntryRows.length > 3 && overviewSectionBoxScrollable
      )}>
      <Flex flexDirection="column" gap="spacingL">
        <Flex justifyContent="space-between" alignItems="flex-start" gap="spacingL" flexWrap="wrap">
          <Flex flexDirection="column" gap="spacingXs" style={{ flex: '1 1 240px' }}>
            <Heading as="h2" marginBottom="none">
              Overview
            </Heading>
            <Paragraph marginBottom="none">
              Review your content and associated entries below. Select which entries you&apos;d like
              to create.
            </Paragraph>
          </Flex>
          <Button
            variant="primary"
            onClick={handleCreateSelected}
            isLoading={isCreating}
            isDisabled={selectedEntryTempIds.size === 0}>
            Create selected entries
          </Button>
        </Flex>

        {checkboxEntryRows.length === 0 ? (
          <Note variant="neutral">
            No entries were found in this preview. When the document is parsed successfully, entries
            to create will appear here.
          </Note>
        ) : (
          <CheckboxEntryList
            rows={checkboxEntryRows}
            selectedIds={selectedEntryTempIds}
            onToggle={handleToggle}
          />
        )}
      </Flex>

      <SummaryModal
        isOpen={summaryEntries !== null}
        sdk={sdk}
        entries={summaryEntries ?? []}
        contentTypeDisplayInfoMap={contentTypeDisplayInfoMap}
        defaultLocale={sdk.locales.default}
        onDone={handleSummaryDone}
      />
    </Box>
  );
};

export default OverviewSection;
