import React, { useEffect, useState } from 'react';
import { Flex, Text, Menu } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { useDebounce } from 'use-debounce';
import { ContentTypeField, FieldFilterValue } from '../types';
import { styles } from './FieldFilter.styles';
import { Asset, Entry } from 'contentful-management';
import * as icons from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

const FILTER_OPERATORS: Array<{ value: FieldFilterValue['operator']; label: string }> = [
  { value: 'in', label: 'is' },
  { value: 'ne', label: 'is not' },
  { value: 'match', label: 'matches' },
  { value: 'exists', label: 'is not empty' },
  { value: 'not exists', label: 'is empty' },
];

const LINK_FILTER_OPERATORS: Array<{ value: FieldFilterValue['operator']; label: string }> = [
  { value: 'in', label: 'is' },
  { value: 'ne', label: 'is not' },
  // { value: 'match', label: 'matches' },
  { value: 'exists', label: 'is not empty' },
  { value: 'not exists', label: 'is empty' },
];

const ARRAY_FILTER_OPERATORS: Array<{ value: FieldFilterValue['operator']; label: string }> = [
  { value: 'in', label: 'include one of' },
  { value: 'nin', label: "don't include" },
  { value: 'all', label: 'include all of' },
  { value: 'exists', label: 'is not empty' },
  { value: 'not exists', label: 'is empty' },
];

const NUMBER_FILTER_OPERATORS: Array<{ value: FieldFilterValue['operator']; label: string }> = [
  { value: 'in', label: 'is' },
  { value: 'ne', label: 'is not' },
  { value: 'lt', label: 'is less than' },
  { value: 'lte', label: 'is less than or equal to' },
  { value: 'gt', label: 'is greater than' },
  { value: 'gte', label: 'is greater than or equal to' },
  { value: 'exists', label: 'is not empty' },
  { value: 'not exists', label: 'is empty' },
];

const isObjectField = (field: ContentTypeField) => {
  return field.type === 'Link';
};
const isArrayField = (field: ContentTypeField) => {
  return field.type === 'Array';
};
const isNumberField = (field: ContentTypeField) => {
  return field.type === 'Integer' || field.type === 'Number';
};
const getFilterOperators = (field: ContentTypeField) => {
  if (isObjectField(field)) {
    return LINK_FILTER_OPERATORS;
  }
  if (isArrayField(field)) {
    return ARRAY_FILTER_OPERATORS;
  }
  if (isNumberField(field)) {
    return NUMBER_FILTER_OPERATORS;
  }
  return FILTER_OPERATORS;
};

interface FieldFilterProps {
  field: ContentTypeField;
  setFieldFilterValues: React.Dispatch<React.SetStateAction<FieldFilterValue[]>>;
}

export const FieldFilter = ({ field, setFieldFilterValues }: FieldFilterProps) => {
  const sdk = useSDK<PageAppSDK>();
  const [selectedOperator, setSelectedOperator] = useState<FieldFilterValue['operator']>('in');
  const [inputValue, setInputValue] = useState('');
  const [debouncedInputValue] = useDebounce(inputValue, 500);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const selectedOperatorLabel =
    getFilterOperators(field).find((op) => op.value === selectedOperator)?.label || 'is';

  const isEntrySelector =
    field.type === 'Link' && field.fieldControl?.widgetId === 'entryLinkEditor';
  const isEntrysSelector =
    field.type === 'Array' && field.fieldControl?.widgetId === 'entryLinksEditor';
  const isAssetSelector =
    field.type === 'Link' && field.fieldControl?.widgetId === 'assetLinkEditor';
  const isAssetsSelector =
    field.type === 'Array' && field.fieldControl?.widgetId === 'assetLinksEditor';

  const isInput = !isEntrySelector && !isEntrysSelector && !isAssetSelector;

  const showValueInput = selectedOperator !== 'exists' && selectedOperator !== 'not exists';

  // Update the field filter value when the operator or debounced input value changes
  useEffect(() => {
    const newFilterValue: FieldFilterValue = {
      fieldUniqueId: field.uniqueId,
      operator: selectedOperator,
      value: debouncedInputValue,
      entryIds:
        selectedEntries.length > 0 ? selectedEntries : selectedEntry ? [selectedEntry] : undefined,
      assetIds:
        selectedAssets.length > 0 ? selectedAssets : selectedAsset ? [selectedAsset] : undefined,
      contentTypeField: field,
    };

    setFieldFilterValues((prev: FieldFilterValue[]) => {
      const existingIndex = prev.findIndex(
        (f: FieldFilterValue) => f.fieldUniqueId === field.uniqueId
      );
      if (existingIndex >= 0) {
        // Update existing filter
        const updated = [...prev];
        updated[existingIndex] = newFilterValue;
        return updated;
      } else {
        // Add new filter
        return [...prev, newFilterValue];
      }
    });
  }, [
    selectedOperator,
    debouncedInputValue,
    // triggering multiple events...input should be enough
    // selectedEntry,
    // selectedEntries,
    // selectedAsset,
    field.uniqueId,
    setFieldFilterValues,
  ]);

  // -----------------------------
  // Entry selection
  // -----------------------------
  const handleSelectEntry = async () => {
    try {
      // Extract allowed content types from field validations
      const linkContentTypeValidation = field.validations?.find(
        (v) => v.linkContentType && Array.isArray(v.linkContentType)
      );
      const contentTypes = linkContentTypeValidation?.linkContentType;

      const entry = (await sdk.dialogs.selectSingleEntry({
        locale: sdk.locales.default,
        ...(contentTypes && contentTypes.length > 0 ? { contentTypes } : {}),
      })) as Entry | null;
      if (entry) {
        setSelectedEntry(entry.sys.id);
        setInputValue(entry.sys.id);
      }
    } catch (error) {
      console.error('Error selecting entry:', error);
    }
  };

  // -----------------------------
  // Entries selection
  // -----------------------------
  const handleSelectEntries = async () => {
    try {
      // Extract allowed content types from field validations
      const linkContentTypeValidation = field.validations?.find(
        (v) => v.linkContentType && Array.isArray(v.linkContentType)
      );
      const contentTypes = linkContentTypeValidation?.linkContentType;

      // Note: selectMultipleEntries might not exist, fallback to selectSingleEntry in a loop
      // or check SDK documentation for the correct method name
      const entries = (await sdk.dialogs.selectMultipleEntries({
        locale: sdk.locales.default,
        ...(contentTypes && contentTypes.length > 0 ? { contentTypes } : {}),
      })) as Array<Entry> | null;
      if (entries && entries.length > 0) {
        const entryIds = entries.map((entry) => entry.sys.id);
        setSelectedEntries(entryIds);
        setInputValue(entryIds.join(','));
      }
    } catch (error) {
      console.error('Error selecting entries:', error);
    }
  };

  // -----------------------------
  // Asset selection
  // -----------------------------
  const handleSelectAsset = async () => {
    try {
      const asset = (await sdk.dialogs.selectSingleAsset({
        locale: sdk.locales.default,
      })) as Asset | null;
      if (asset) {
        setSelectedAsset(asset.sys.id);
        setInputValue(asset.sys.id);
      }
    } catch (error) {
      console.error('Error selecting asset:', error);
    }
  };

  // -----------------------------
  // Assets selection
  // -----------------------------
  const handleSelectAssets = async () => {
    try {
      const assets = (await sdk.dialogs.selectMultipleAssets({
        locale: sdk.locales.default,
      })) as Array<Asset> | null;
      if (assets && assets.length > 0) {
        const assetIds = assets.map((asset) => asset.sys.id);
        setSelectedAssets(assetIds);
        setInputValue(assetIds.join(','));
      }
    } catch (error) {
      console.error('Error selecting assets:', error);
    }
  };

  return (
    <Flex className={styles.container}>
      <Text className={styles.fieldName}>{field.name}</Text>
      <Flex className={styles.operatorDropdownContainer}>
        <Menu>
          <Menu.Trigger>
            <div className={styles.operatorDropdown}>{selectedOperatorLabel}</div>
          </Menu.Trigger>
          <Menu.List>
            {getFilterOperators(field).map((operator) => (
              <Menu.Item
                key={operator.value}
                isActive={selectedOperator === operator.value}
                onClick={() => setSelectedOperator(operator.value as FieldFilterValue['operator'])}>
                {operator.label}
              </Menu.Item>
            ))}
          </Menu.List>
        </Menu>
      </Flex>

      {showValueInput && (
        <div className={styles.inputContainer}>
          {isEntrySelector && (
            <button className={styles.inputButton} onClick={handleSelectEntry}>
              {selectedEntry ? `${selectedEntry.substring(0, 8)}...` : 'Select Entry'}
            </button>
          )}
          {isEntrysSelector && (
            <button className={styles.inputButton} onClick={handleSelectEntries}>
              {selectedEntries.length > 0
                ? `${selectedEntries.length} Entries selected`
                : 'Select Entries'}
            </button>
          )}
          {isAssetSelector && (
            <button className={styles.inputButton} onClick={handleSelectAsset}>
              {selectedAsset ? `${selectedAsset.substring(0, 8)}...` : 'Select Asset'}
            </button>
          )}
          {isAssetsSelector && (
            <button className={styles.inputButton} onClick={handleSelectAssets}>
              {selectedAssets.length > 0
                ? `${selectedAssets.length} Assets selected`
                : 'Select Assets'}
            </button>
          )}

          {isInput && (
            <input
              value={inputValue}
              className={styles.input}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter value"
            />
          )}
        </div>
      )}

      {!showValueInput && <div className={styles.inputContainerEmpty}></div>}

      <div id="closeButton" className={styles.closeButton}>
        <icons.XIcon
          size="small"
          style={{ width: 12, height: 12, color: tokens.red500 }}
          onClick={() =>
            setFieldFilterValues((prev) => prev.filter((f) => f.fieldUniqueId !== field.uniqueId))
          }
        />
      </div>
    </Flex>
  );
};
