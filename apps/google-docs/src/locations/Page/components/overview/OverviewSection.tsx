import { useEffect, useMemo, useState } from 'react';
import { cx } from '@emotion/css';
import { Box, Button, Flex, Heading, Note, Paragraph } from '@contentful/f36-components';
import type { MappingReviewSuspendPayload, PreviewPayload } from '@types';
import {
  buildCheckboxEntryList,
  collectCheckboxEntryListRowIds,
  type ContentTypeDisplayInfoMap,
} from '../../../../utils/checkboxEntryList';
import { fetchContentTypesInfoByIds } from '../../../../services/contentTypeService';
import { CheckboxEntryList } from './CheckboxEntryList';
import { overviewSectionBox, overviewSectionBoxScrollable } from './OverviewSection.styles';
import { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps } from 'contentful-management';
import { SummaryModal } from '../modals/SummaryModal';
import { isPreviewPayload } from '../../../../utils/utils';

interface OverviewSectionProps {
  sdk: PageAppSDK;
  payload: PreviewPayload | MappingReviewSuspendPayload;
  oauthToken: string;
  onReturnToMainPage: () => void;
  onCreateSelected?: () => Promise<void>;
}

const OverviewSection = ({
  sdk,
  payload,
  oauthToken,
  onReturnToMainPage,
  onCreateSelected,
}: OverviewSectionProps) => {
  const [contentTypeDisplayInfoMap, setContentTypeDisplayInfoMap] = useState<
    ContentTypeDisplayInfoMap | undefined
  >();
  const [selectedEntryTempIds, setSelectedEntryTempIds] = useState<Set<string>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [summaryEntries, setSummaryEntries] = useState<EntryProps[] | null>(null);

  const overviewPayload = useMemo<PreviewPayload>(() => {
    if (isPreviewPayload(payload)) {
      return payload;
    }

    return {
      // TODO: remove this temporary mock once the backend provides preview entries
      entries: [
        {
          fields: {
            url: {
              'en-US': '/blog/an-url',
            },
            internalLabel: {
              'en-US': '/blog/another-url',
            },
          },
          tempId: 'url_1',
          contentTypeId: 'url',
        },
      ],
      assets: [],
      referenceGraph: payload.referenceGraph,
      normalizedDocument: payload.normalizedDocument,
    };
  }, [payload]);

  useEffect(() => {
    const fetchContentTypesInfo = async () => {
      const contentTypeIds = [
        ...new Set(overviewPayload.entries.map((entry) => entry.contentTypeId)),
      ]
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
  }, [sdk, overviewPayload.entries]);

  const checkboxEntryRows = useMemo(
    () => buildCheckboxEntryList(overviewPayload, contentTypeDisplayInfoMap, sdk.locales.default),
    [overviewPayload, contentTypeDisplayInfoMap, sdk.locales.default]
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
    if (selectedEntryTempIds.size === 0 || !onCreateSelected) {
      return;
    }

    setIsCreating(true);

    try {
      await onCreateSelected();
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
            isDisabled={selectedEntryTempIds.size === 0 || !onCreateSelected}>
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
