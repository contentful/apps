import React, { useEffect, useState } from 'react';
import { Autocomplete, Box, Flex, FormControl, IconButton } from '@contentful/f36-components';
import { styles } from '../locations/ConfigScreen.styles';
import { TrashSimpleIcon } from '@contentful/f36-icons';
import { ContentTypeProps } from 'contentful-management';
import { AutocompleteItem, Override, OverrideIsInvalid } from '../utils/types';
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
  overrideIsInvalid?: OverrideIsInvalid;
  overrides: Override[];
  onOverrideChange: (override: Override, contentTypeId?: string, fieldId?: string) => void;
  onOverrideDelete: (overrideId: string) => void;
};

const OverrideRow: React.FC<OverrideRowProps> = ({
  contentTypes,
  overrideItem,
  overrideIsInvalid,
  overrides,
  onOverrideChange,
  onOverrideDelete,
}: OverrideRowProps) => {
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

  const handleCTInputChange = (name: string) => {
    if (!name) {
      onOverrideChange(overrideItem, '', '');

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
      onOverrideChange(overrideItem, selectedItem.sys.id, '');

      if (selectedItem.name !== selectedContentType?.name) {
        setSelectedField(EMPTY_AUTOCOMPLETE_ITEM);
      }

      setSelectedContentType({ id: selectedItem.sys.id, name: selectedItem.name });
    }
  };

  const handleFieldInputChange = (name: string) => {
    if (!name) {
      onOverrideChange(overrideItem, undefined, '');

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
      onOverrideChange(overrideItem, undefined, selectedItem.id);

      setSelectedField({ id: selectedItem.id, name: selectedItem.name });
    }
  };

  return (
    <>
      <Flex flexDirection="row" alignItems="space-evenly" gap="spacingS" key={overrideItem.id}>
        <FormControl
          id="contentTypeId"
          className={styles.formControl}
          isInvalid={overrideIsInvalid?.isContentTypeMissing}
          isRequired>
          <FormControl.Label marginBottom="spacingS">Content type</FormControl.Label>
          <Autocomplete
            key={`${overrideItem.id}-content-type`}
            className={styles.autocomplete}
            items={filteredContentTypes.map((ct) => ({ id: ct.sys.id, name: ct.name }))}
            onInputValueChange={(name: string) => handleCTInputChange(name)}
            itemToString={(item: AutocompleteItem) => item.name}
            renderItem={(item: AutocompleteItem) => item.name}
            selectedItem={selectedContentType}
            onSelectItem={(item: AutocompleteItem) => handleCTItemSelection(item)}
            placeholder="Content type name"
          />
          {overrideIsInvalid?.isContentTypeMissing && (
            <FormControl.ValidationMessage>Content type is required</FormControl.ValidationMessage>
          )}
        </FormControl>
        <FormControl
          id="fieldName"
          className={styles.formControl}
          isInvalid={overrideIsInvalid?.isFieldMissing}
          isRequired>
          <FormControl.Label marginBottom="spacingS">Field name</FormControl.Label>
          <Autocomplete
            key={`${overrideItem.id}-field`}
            className={styles.autocomplete}
            items={filteredFields}
            isDisabled={!overrideItem.contentTypeId}
            selectedItem={selectedField}
            itemToString={(item: AutocompleteItem) => item.name}
            renderItem={(item: AutocompleteItem) => item.name}
            onInputValueChange={(name: string) => handleFieldInputChange(name)}
            onSelectItem={(item: AutocompleteItem) => handleFieldItemSelection(item)}
            placeholder="Field name"
          />
          {overrideIsInvalid?.isFieldMissing && (
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
