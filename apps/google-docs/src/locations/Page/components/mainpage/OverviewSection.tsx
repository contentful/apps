import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Heading, Note, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { PreviewPayload } from '@types';
import {
  buildCheckboxEntryList,
  collectCheckboxEntryListRowIds,
  type ContentTypeDisplayInfoMap,
} from '../../../../utils/checkboxEntryList';
import { fetchContentTypesInfoByIds } from '../../../../services/contentTypeService';
import { CheckboxEntryList } from './CheckboxEntryList';
import { createEntriesFromPreviewPayload } from '../../../../services/entryService';
import { PageAppSDK } from '@contentful/app-sdk';

interface OverviewSectionProps {
  sdk: PageAppSDK;
  payload: PreviewPayload;
  onReturnToMainPage: () => void;
}

const OverviewSection = ({ sdk, payload, onReturnToMainPage }: OverviewSectionProps) => {
  const [contentTypeDisplayInfoMap, setContentTypeDisplayInfoMap] = useState<
    ContentTypeDisplayInfoMap | undefined
  >();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);

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
  }, [sdk]);

  const checkboxEntryRows = useMemo(
    () => buildCheckboxEntryList(payload, contentTypeDisplayInfoMap, sdk.locales.default),
    [payload, contentTypeDisplayInfoMap, sdk.locales.default]
  );

  useEffect(() => {
    setSelectedIds(new Set(collectCheckboxEntryListRowIds(checkboxEntryRows)));
  }, [checkboxEntryRows]);

  const handleToggle = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
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
    if (selectedIds.size === 0) {
      return;
    }
    setIsCreating(true);
    try {
      const result = await createEntriesFromPreviewPayload(sdk, payload, {
        selectedRowIds: selectedIds,
      });
      if (result.errors.length > 0) {
        sdk.notifier.error('Failed to create entries');
      } else {
        onReturnToMainPage();
      }
    } catch {
      sdk.notifier.error('Failed to create entries');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box
      padding="spacingL"
      style={{
        backgroundColor: tokens.gray100,
        border: `1px solid ${tokens.gray300}`,
        borderRadius: tokens.borderRadiusMedium,
      }}>
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
            isDisabled={selectedIds.size === 0}>
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
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
        )}
      </Flex>
    </Box>
  );
};

export default OverviewSection;
