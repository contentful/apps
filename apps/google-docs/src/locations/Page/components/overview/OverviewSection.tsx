import { useEffect, useMemo, useState } from 'react';
import { cx } from '@emotion/css';
import { Box, Button, Flex, Heading, Note, Paragraph } from '@contentful/f36-components';
import type { MappingReviewSuspendPayload, PreviewPayload } from '@types';
import {
  buildCheckboxEntryList,
  buildCheckboxEntryListFromMappingReviewPayload,
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

type CreateOverviewSectionProps = {
  sdk: PageAppSDK;
  payload: PreviewPayload;
  onReturnToMainPage: () => void;
};

type MappingReviewOverviewSectionProps = {
  sdk?: PageAppSDK;
  payload: MappingReviewSuspendPayload;
  onReturnToMainPage?: () => void;
};

type OverviewSectionProps = CreateOverviewSectionProps | MappingReviewOverviewSectionProps;

function isMappingReviewPayload(
  payload: PreviewPayload | MappingReviewSuspendPayload
): payload is MappingReviewSuspendPayload {
  return 'suspendStepId' in payload && payload.suspendStepId === 'mapping-review';
}

const OverviewSection = (props: OverviewSectionProps) => {
  const isMappingReviewMode = isMappingReviewPayload(props.payload);
  const sdk = 'sdk' in props ? props.sdk : undefined;
  const [contentTypeDisplayInfoMap, setContentTypeDisplayInfoMap] = useState<
    ContentTypeDisplayInfoMap | undefined
  >();
  const [selectedEntryTempIds, setSelectedEntryTempIds] = useState<Set<string>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [summaryEntries, setSummaryEntries] = useState<EntryProps[] | null>(null);

  useEffect(() => {
    if (isMappingReviewMode || !sdk) {
      setContentTypeDisplayInfoMap(undefined);
      return;
    }

    const fetchContentTypesInfo = async () => {
      const contentTypeIds = [...new Set(props.payload.entries.map((entry) => entry.contentTypeId))]
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
  }, [isMappingReviewMode, props.payload, sdk]);

  const checkboxEntryRows = useMemo(() => {
    if (isMappingReviewMode) {
      return buildCheckboxEntryListFromMappingReviewPayload(props.payload);
    }

    return buildCheckboxEntryList(props.payload, contentTypeDisplayInfoMap, sdk?.locales.default);
  }, [contentTypeDisplayInfoMap, isMappingReviewMode, props.payload, sdk?.locales.default]);

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
    if (isMappingReviewMode || !sdk) {
      return;
    }

    if (selectedEntryTempIds.size === 0) {
      return;
    }
    setIsCreating(true);
    try {
      const result = await createEntriesFromPreviewPayload(
        sdk,
        props.payload,
        selectedEntryTempIds
      );
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
    if ('onReturnToMainPage' in props) {
      props.onReturnToMainPage();
    }
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
              {isMappingReviewMode
                ? 'Review the entry structure produced for the mapping step. Entry creation continues after mapping review is complete.'
                : 'Review your content and associated entries below. Select which entries you&apos;d like to create.'}
            </Paragraph>
          </Flex>
          {!isMappingReviewMode ? (
            <Button
              variant="primary"
              onClick={handleCreateSelected}
              isLoading={isCreating}
              isDisabled={selectedEntryTempIds.size === 0}>
              Create selected entries
            </Button>
          ) : null}
        </Flex>

        {checkboxEntryRows.length === 0 ? (
          <Note variant="neutral">
            {isMappingReviewMode
              ? 'No entry mappings are available yet. Once the mapping review payload is generated, the planned entries will appear here.'
              : 'No entries were found in this preview. When the document is parsed successfully, entries to create will appear here.'}
          </Note>
        ) : (
          <CheckboxEntryList
            rows={checkboxEntryRows}
            selectedIds={selectedEntryTempIds}
            onToggle={handleToggle}
          />
        )}
      </Flex>

      {!isMappingReviewMode && sdk ? (
        <SummaryModal
          isOpen={summaryEntries !== null}
          sdk={sdk}
          entries={summaryEntries ?? []}
          contentTypeDisplayInfoMap={contentTypeDisplayInfoMap}
          defaultLocale={sdk.locales.default}
          onDone={handleSummaryDone}
        />
      ) : null}
    </Box>
  );
};

export default OverviewSection;
