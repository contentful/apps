import React, { useEffect, useState } from 'react';
import { Autocomplete, Flex, FormControl, IconButton } from '@contentful/f36-components';
import { styles } from '../locations/ConfigScreen.styles';
import { TrashSimpleIcon } from '@contentful/f36-icons';
import { ContentTypeProps } from 'contentful-management';
import { AutocompleteItem, Override } from '../utils/consts';
import {
  filterItemsByName,
  getEmptyAutocompleteItem,
  getFieldsFrom,
  getInitialContentTypeName,
  getInitialFieldName,
  normalizeString,
} from '../utils/override';

type OverrideRowProps = {
  contentTypes: ContentTypeProps[];
  overrideItem: Override;
  setOverrides: (item: any) => void;
};

const OverrideRow: React.FC<OverrideRowProps> = ({ contentTypes, overrideItem, setOverrides }) => {
  const [filteredContentTypes, setFilteredContentTypes] = useState<ContentTypeProps[]>([]);
  const [filteredFields, setfilteredFields] = useState<AutocompleteItem[]>([]);
  const [selectedContentType, setSelectedContentType] =
    useState<AutocompleteItem>(getEmptyAutocompleteItem);
  const [selectedField, setSelectedField] = useState<AutocompleteItem>(getEmptyAutocompleteItem);

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

  useEffect(() => {
    setFilteredContentTypes(contentTypes);
    if (selectedContentType?.id) {
      setfilteredFields(getFieldsFrom(contentTypes, selectedContentType.id));
    }
  }, [contentTypes, selectedContentType]);

  const deleteOverride = (overrideItem: Override) => {
    setOverrides((prev: Override[]) => prev.filter((o) => o.id !== overrideItem.id));
  };

  const updateOverride = (contentTypeId?: string, fieldId?: string) => {
    setOverrides((prev: Override[]) =>
      prev.map((override) => {
        if (override.id !== overrideItem.id) {
          return override;
        }

        const newContentTypeId =
          contentTypeId || contentTypeId === '' ? { contentTypeId } : undefined;
        const newFieldId = fieldId || fieldId === '' ? { fieldId } : undefined;

        return {
          ...override,
          ...newContentTypeId,
          ...newFieldId,
        };
      })
    );
  };

  const handleCTInputChange = (name: string) => {
    if (!name) {
      updateOverride('', '');

      setFilteredContentTypes(contentTypes);
      setSelectedContentType(getEmptyAutocompleteItem());
      setSelectedField(getEmptyAutocompleteItem());
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
        setSelectedField(getEmptyAutocompleteItem());
      }

      setSelectedContentType({ id: selectedItem.sys.id, name: selectedItem.name });
    }
  };

  const handleFieldInputChange = (name: string) => {
    if (!name) {
      updateOverride(undefined, '');

      if (selectedContentType) {
        setfilteredFields(getFieldsFrom(contentTypes, selectedContentType.id));
        setSelectedField(getEmptyAutocompleteItem());
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
      <Flex flexDirection="row" alignItems="center" gap="spacingS" key={overrideItem.id}>
        <FormControl id="contentTypeId" className={styles.formControl}>
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
        </FormControl>
        <FormControl id="fieldName" className={styles.formControl}>
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
        </FormControl>
        <IconButton
          aria-label="Delete override"
          icon={<TrashSimpleIcon />}
          variant="secondary"
          onClick={() => deleteOverride(overrideItem)}
        />
      </Flex>
    </>
  );
};

export default OverrideRow;
