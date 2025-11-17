import React, { useEffect, useState } from 'react';
import { Autocomplete, Flex, FormControl, IconButton, Box } from '@contentful/f36-components';
import { styles } from '../locations/ConfigScreen.styles';
import { TrashSimpleIcon } from '@contentful/f36-icons';
import { ContentTypeProps } from 'contentful-management';
import { AutocompleteItem, Override, OverrideError } from '../utils/types';
import {
  EMPTY_AUTOCOMPLETE_ITEM,
  filterItemsByName,
  getFieldsFrom,
  getInitialContentTypeName,
  getInitialFieldName,
  normalizeString,
} from '../utils/override';

type OverrideRowProps = {
  contentTypes: ContentTypeProps[];
  overrideItem: Override;
  overrideError?: OverrideError;
  overrides: Override[];
  onOverrideChange: (override: Override) => void;
  onOverrideDelete: (overrideId: string) => void;
};

const OverrideRow: React.FC<OverrideRowProps> = ({
  contentTypes,
  overrideItem,
  overrideError,
  overrides,
  onOverrideChange,
  onOverrideDelete,
}) => {
  const [filteredContentTypes, setFilteredContentTypes] = useState<ContentTypeProps[]>([]);
  const [filteredFields, setfilteredFields] = useState<AutocompleteItem[]>([]);
  const [selectedContentType, setSelectedContentType] =
    useState<AutocompleteItem>(EMPTY_AUTOCOMPLETE_ITEM);
  const [selectedField, setSelectedField] = useState<AutocompleteItem>(EMPTY_AUTOCOMPLETE_ITEM);

  useEffect(() => {
    const initialContentType = getInitialContentTypeName(contentTypes, overrideItem);
    const initialField = getInitialFieldName(contentTypes, overrideItem);

    setSelectedContentType((prev) => {
      if (prev.id !== initialContentType.id || prev.name !== initialContentType.name) {
        return initialContentType;
      }
      return prev;
    });

    setSelectedField((prev) => {
      if (prev.id !== initialField.id || prev.name !== initialField.name) {
        return initialField;
      }
      return prev;
    });
  }, [contentTypes, overrideItem.contentTypeId, overrideItem.fieldId]);

  const overridesContainingContentType = (contentTypeId: string) =>
    overrides.filter(
      (override) => override.contentTypeId === contentTypeId && override.id !== overrideItem.id
    );

  useEffect(() => {
    const contentTypesWithoutDuplicates = contentTypes.filter(
      (contentType) => overridesContainingContentType(contentType.sys.id).length === 0
    );

    setFilteredContentTypes(contentTypesWithoutDuplicates);
    if (selectedContentType?.id) {
      setfilteredFields(getFieldsFrom(contentTypes, selectedContentType.id));
    }
  }, [contentTypes, selectedContentType, overrides]);

  const updateOverride = (contentTypeId?: string, fieldId?: string) => {
    const newContentTypeId = contentTypeId || contentTypeId === '' ? { contentTypeId } : undefined;
    const newFieldId = fieldId || fieldId === '' ? { fieldId } : undefined;

    onOverrideChange({
      ...overrideItem,
      ...newContentTypeId,
      ...newFieldId,
    });
  };

  const handleCTInputChange = (name: string) => {
    if (!name) {
      updateOverride('', '');

      setFilteredContentTypes(contentTypes);
      setSelectedContentType(EMPTY_AUTOCOMPLETE_ITEM);
      setSelectedField(EMPTY_AUTOCOMPLETE_ITEM);
      return;
    }

    const newFilteredItems = filterItemsByName(contentTypes, name);
    setFilteredContentTypes(newFilteredItems as ContentTypeProps[]);
  };

  const handleCTItemSelection = (value: AutocompleteItem) => {
    const selectedItem = contentTypes.find(
      (item) => normalizeString(item?.name) === normalizeString(value.name)
    );

    if (selectedItem) {
      updateOverride(selectedItem.sys.id, '');

      if (selectedItem.name !== selectedContentType?.name) {
        setSelectedField(EMPTY_AUTOCOMPLETE_ITEM);
      }

      setSelectedContentType({ id: selectedItem.sys.id, name: selectedItem.name });
    }
  };

  const handleFieldInputChange = (name: string) => {
    if (!name) {
      updateOverride(undefined, '');

      if (selectedContentType) {
        setfilteredFields(getFieldsFrom(contentTypes, selectedContentType.id));
        setSelectedField(EMPTY_AUTOCOMPLETE_ITEM);
      }
      return;
    }

    const fields = getFieldsFrom(contentTypes, overrideItem.contentTypeId);

    const newFilteredItems = filterItemsByName(fields, name);
    setfilteredFields(newFilteredItems as AutocompleteItem[]);
  };

  const handleFieldItemSelection = (value: AutocompleteItem) => {
    const selectedItem = getFieldsFrom(contentTypes, overrideItem.contentTypeId).find(
      (item) => normalizeString(item?.name) === normalizeString(value.name)
    );

    if (selectedItem) {
      updateOverride(undefined, selectedItem.id);

      setSelectedField({ id: selectedItem.id, name: selectedItem.name });
    }
  };

  return (
    <>
      <Flex flexDirection="row" alignItems="space-evenly" gap="spacingS" key={overrideItem.id}>
        <FormControl
          id="contentTypeId"
          className={styles.formControl}
          isInvalid={overrideError?.isContentTypeMissing}
          isRequired>
          <FormControl.Label marginBottom="spacingS">Content type</FormControl.Label>
          <Autocomplete
            key={`${overrideItem.id}-content-type`}
            items={filteredContentTypes.map((ct) => ({ id: ct.sys.id, name: ct.name }))}
            onInputValueChange={(name: string) => handleCTInputChange(name)}
            itemToString={(item: AutocompleteItem) => item.name}
            renderItem={(item: AutocompleteItem) => item.name}
            selectedItem={selectedContentType}
            onSelectItem={(item: AutocompleteItem) => handleCTItemSelection(item)}
            placeholder="Content type name"
          />
          {overrideError?.isContentTypeMissing && (
            <FormControl.ValidationMessage>Content type is required</FormControl.ValidationMessage>
          )}
        </FormControl>
        <FormControl
          id="fieldName"
          className={styles.formControl}
          isInvalid={overrideError?.isFieldMissing}
          isRequired>
          <FormControl.Label marginBottom="spacingS">Field name</FormControl.Label>
          <Autocomplete
            key={`${overrideItem.id}-field`}
            items={filteredFields}
            isDisabled={!overrideItem.contentTypeId}
            selectedItem={selectedField}
            itemToString={(item: AutocompleteItem) => item.name}
            renderItem={(item: AutocompleteItem) => item.name}
            onInputValueChange={(name: string) => handleFieldInputChange(name)}
            onSelectItem={(item: AutocompleteItem) => handleFieldItemSelection(item)}
            placeholder="Field name"
          />
          {overrideError?.isFieldMissing && (
            <FormControl.ValidationMessage>Field name is required</FormControl.ValidationMessage>
          )}
        </FormControl>
        <Box marginTop="spacingXl">
          <IconButton
            aria-label="Delete override"
            icon={<TrashSimpleIcon />}
            variant="secondary"
            onClick={() => onOverrideDelete(overrideItem.id)}
          />
        </Box>
      </Flex>
    </>
  );
};

export default OverrideRow;
