import React from 'react';
import {
  Box,
  FormControl,
  Select,
  Radio,
  Stack,
  Checkbox,
  Text,
  Skeleton,
  Note,
} from '@contentful/f36-components';
import { ImportMode, ContentTypeMeta } from '../lib/types';

interface TypeSelectorProps {
  contentTypes: ContentTypeMeta[];
  selectedContentType: string | null;
  mode: ImportMode;
  shouldPublish: boolean;
  loading?: boolean;
  error?: string | null;
  onContentTypeChange: (contentTypeId: string) => void;
  onModeChange: (mode: ImportMode) => void;
  onPublishChange: (shouldPublish: boolean) => void;
}

/**
 * Component to select content type, import mode, and publish option
 */
export function TypeSelector({
  contentTypes,
  selectedContentType,
  mode,
  shouldPublish,
  loading,
  error,
  onContentTypeChange,
  onModeChange,
  onPublishChange,
}: TypeSelectorProps) {
  if (loading) {
    return (
      <Box>
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={3} />
        </Skeleton.Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Note variant="negative" title="Error loading content types">
        {error}
      </Note>
    );
  }

  return (
    <Stack flexDirection="column" spacing="spacingM">
      <FormControl isRequired>
        <FormControl.Label>Content Type</FormControl.Label>
        <Select
          value={selectedContentType || ''}
          onChange={(e) => onContentTypeChange(e.target.value)}>
          <Select.Option value="">Select a content type...</Select.Option>
          {contentTypes.map((ct) => (
            <Select.Option key={ct.id} value={ct.id}>
              {ct.name} ({ct.id})
            </Select.Option>
          ))}
        </Select>
        <FormControl.HelpText>
          Choose the content type you want to import entries for
        </FormControl.HelpText>
      </FormControl>

      <FormControl>
        <FormControl.Label>Import Mode</FormControl.Label>
        <Stack flexDirection="column" spacing="spacingXs">
          <Radio
            id="mode-create"
            value="create"
            isChecked={mode === 'create'}
            onChange={() => onModeChange('create')}>
            <Text>
              <strong>Create</strong> - Create new entries
            </Text>
          </Radio>
          <Radio
            id="mode-update"
            value="update"
            isChecked={mode === 'update'}
            onChange={() => onModeChange('update')}>
            <Text>
              <strong>Update</strong> - Update existing entries (match by sys.id or natural key)
            </Text>
          </Radio>
        </Stack>
        <FormControl.HelpText>
          {mode === 'create'
            ? 'New entries will be created for each row'
            : 'Existing entries will be updated. CSV must include sys.id column or use a natural key field.'}
        </FormControl.HelpText>
      </FormControl>

      <FormControl>
        <Checkbox
          id="publish"
          isChecked={shouldPublish}
          onChange={(e) => onPublishChange(e.target.checked)}>
          Publish entries after {mode === 'create' ? 'creation' : 'update'}
        </Checkbox>
        <FormControl.HelpText>
          If checked, entries will be published automatically after being created or updated
        </FormControl.HelpText>
      </FormControl>
    </Stack>
  );
}
