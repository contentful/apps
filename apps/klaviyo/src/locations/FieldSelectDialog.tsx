import React, { useEffect, useState } from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Box, Button, Flex, Checkbox, Text, Stack, Heading } from '@contentful/f36-components';
import { FieldMapping as BaseFieldMapping } from '../config/klaviyo';
import logger from '../utils/logger';
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';
import { KlaviyoService } from '../utils/klaviyo-service';

// Extend Window interface to allow our custom property
declare global {
  interface Window {
    _klaviyoDialogResult?: {
      selectedFields?: string[];
      mappings?: any[];
      success?: boolean;
      action?: string;
      error?: string;
    };
  }
}

interface Field {
  id: string;
  name: string;
  type: string;
  disabled?: boolean;
  localized?: boolean;
}

// Extend FieldMapping to include optional locale for UI purposes
interface FieldMapping extends BaseFieldMapping {
  locale?: string;
}

export const FieldSelectDialog: React.FC<{ mappings?: FieldMapping[] }> = ({
  mappings: _mappings,
}) => {
  const sdk = useSDK<DialogExtensionSDK>();
  useAutoResizer();
  // Get entry from dialog parameters
  const entry = (sdk.parameters.invocation as any).entry;
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<Field[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [currentMappings, setCurrentMappings] = useState<FieldMapping[]>([]);

  // Get the parameters passed to this dialog
  const {
    fields: availableFields = [],
    preSelectedFields = [],
    contentTypeId = '',
    entryId = '',
    locales: passedLocales,
  } = (sdk.parameters.invocation as {
    fields?: Field[];
    preSelectedFields?: string[];
    showSyncButton?: boolean;
    contentTypeId?: string;
    entryId?: string;
    locales?: any;
  }) || {};

  // Use passedLocales if present, otherwise sdk.locales
  const sdkLocales = passedLocales || sdk.locales || {};
  const availableLocales: { code: string; name: string }[] = (sdkLocales.available || []).map(
    (code: string) => ({
      code,
      name: sdkLocales.names?.[code] || code,
    })
  );
  const defaultLocale = sdkLocales.default;
  // hasLocales: true if any selected field is localized and there are multiple locales
  const anySelectedFieldLocalized = selectedFields.some((f) => f.localized);
  const hasLocales = anySelectedFieldLocalized && availableLocales.length > 1;

  // Load current mappings for the entry on mount
  useEffect(() => {
    async function fetchMappings() {
      if (entryId) {
        const mappings = await getEntryKlaviyoFieldMappings(sdk, entryId);
        setCurrentMappings(mappings);
      }
    }
    fetchMappings();
  }, [sdk, entryId]);

  useEffect(() => {
    if (fields.length && currentMappings.length) {
      // Find fields that are mapped
      const mappedFieldIds = currentMappings.map((m) => {
        return m.id;
      });
      setSelectedFields(fields.filter((f) => mappedFieldIds.includes(f.id)));
    }
  }, [fields, currentMappings]);

  // Build a map from field ID to array of mapped locales
  const fieldLocaleMap: Record<string, string[]> = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    (currentMappings || []).forEach((m) => {
      const fieldId = m.id;
      if (!map[fieldId]) map[fieldId] = [];
      if (m.locale && !map[fieldId].includes(m.locale)) {
        map[fieldId].push(m.locale);
      }
    });
    return map;
  }, [currentMappings]);

  // Total connected fields = number of unique field IDs in mappings
  const connectedFieldsCount = React.useMemo(() => {
    const uniqueFieldIds = new Set((currentMappings || []).map((m) => m.id));
    return uniqueFieldIds.size;
  }, [currentMappings]);

  useEffect(() => {
    // Debug: Log availableFields and preSelectedFields on dialog open
    logger.log('[FieldSelectDialog] availableFields:', availableFields);
    logger.log('[FieldSelectDialog] preSelectedFields:', preSelectedFields);

    async function updateFieldsWithDisabled() {
      let updatedFields = availableFields;
      if (contentTypeId && sdk.cma) {
        try {
          const ct = await sdk.cma.contentType.get({ contentTypeId });
          updatedFields = availableFields.filter((field) => {
            const def = ct.fields.find((f: any) => f.id === field.id);
            if (!def) return true;
            // Boolean
            if (def.type === 'Boolean') return false;
            // Entry reference (single)
            if (def.type === 'Link' && def.linkType === 'Entry') return false;
            // Array of entry references
            if (
              def.type === 'Array' &&
              def.items &&
              def.items.type === 'Link' &&
              def.items.linkType === 'Entry'
            )
              return false;
            return true;
          });
        } catch (e) {
          logger.error('Failed to fetch content type for filtering fields', e);
        }
      }
      setFields(updatedFields);
      const mappedFieldIds = (currentMappings || []).map((m) => m.id);
      setSelectedFields(
        updatedFields.filter(
          (f) =>
            (preSelectedFields && preSelectedFields.includes(f.id)) || mappedFieldIds.includes(f.id)
        )
      );
    }
    updateFieldsWithDisabled();
  }, [availableFields, preSelectedFields, contentTypeId, sdk.cma, currentMappings]);

  useEffect(() => {
    if (hasLocales && selectedLocales.length === 0) {
      setSelectedLocales([defaultLocale]);
    }
  }, [hasLocales, defaultLocale]);

  // Select all logic
  const allSelected = fields.length > 0 && selectedFields.length === fields.length;
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedFields([]);
    } else {
      setSelectedFields(fields.filter((f) => !f.disabled));
    }
  };
  const handleToggleField = (field: Field) => {
    if (selectedFields.some((f) => f.id === field.id)) {
      setSelectedFields((prev) => prev.filter((f) => f.id !== field.id));
    } else {
      setSelectedFields((prev) => [...prev, field]);
    }
  };

  // Locale select all logic
  const allLocalesSelected =
    availableLocales.length > 0 && selectedLocales.length === availableLocales.length;
  const handleSelectAllLocales = () => {
    if (allLocalesSelected) {
      setSelectedLocales([]);
    } else {
      setSelectedLocales(availableLocales.map((l) => l.code));
    }
  };
  const handleToggleLocale = (code: string) => {
    if (selectedLocales.includes(code)) {
      setSelectedLocales((prev) => prev.filter((c) => c !== code));
    } else {
      setSelectedLocales((prev) => [...prev, code]);
    }
  };

  const handleSaveAndSync = async () => {
    setIsSyncing(true);
    try {
      if (contentTypeId && entryId) {
        let newMappings: any[] = [];
        selectedFields.forEach((field) => {
          // Get the field value from the entry
          let fieldValue = '';
          if (entry.fields && entry.fields[field.id]) {
            const fieldData = entry.fields[field.id];
            if (typeof fieldData === 'object' && !Array.isArray(fieldData)) {
              // Handle localized fields
              const firstLocale = Object.keys(fieldData)[0] || 'en-US';
              fieldValue = fieldData[firstLocale];
            } else {
              // Handle non-localized fields
              fieldValue = fieldData;
            }
          }

          if (field.localized) {
            // For localized fields, create a mapping for each selected locale
            selectedLocales.forEach((locale) => {
              const localizedValue = entry.fields?.[field.id]?.[locale] || fieldValue;
              newMappings.push({
                id: field.id,
                klaviyoBlockName: `${field.name}-${locale}`,
                fieldType:
                  field.type.toLowerCase() === 'richtext' ? 'richtext' : field.type.toLowerCase(),
                value: localizedValue,
                contentTypeId: contentTypeId,
                isAsset: field.type === 'Asset' || field.type === 'AssetLink' || false,
                locale,
              });
            });
          } else {
            // For non-localized fields, create a single mapping without locale
            newMappings.push({
              id: field.id,
              klaviyoBlockName: field.name,
              fieldType:
                field.type.toLowerCase() === 'richtext' ? 'richtext' : field.type.toLowerCase(),
              value: fieldValue,
              contentTypeId: contentTypeId,
              isAsset: field.type === 'Asset' || field.type === 'AssetLink' || false,
            });
          }
        });

        await setEntryKlaviyoFieldMappings(sdk, entryId, newMappings);

        const klaviyoService = new KlaviyoService(sdk.cma);

        // Use syncContent to sync the entry
        const response = await klaviyoService.syncContent(newMappings, entry, sdk.cma);
        const hasErrors = response.some((r: any) => r.errors?.length > 0);
        if (response && !hasErrors) {
          sdk.notifier.success('Fields successfully synced to Klaviyo!');
        } else {
          console.error('Error syncing to Klaviyo:', response);
          sdk.notifier.error('Error syncing to Klaviyo');
        }
      }
      sdk.close({
        selectedFields: selectedFields.map((f) => f.id),
        selectedLocales,
        success: true,
      });
    } catch (e) {
      console.error('Error syncing to Klaviyo:', e);
      sdk.notifier.error('Error syncing to Klaviyo');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    sdk.close({ selectedFields: selectedFields.map((f) => f.id), success: false });
  };

  // Step 1: Field selection UI
  const renderFieldStep = () => (
    <>
      <Box style={{ marginBottom: 18 }}>
        <Flex justifyContent="space-between" alignItems="center">
          <Text style={{ color: '#444' }}>Select fields that you want to sync with Klaviyo.</Text>
          <Text fontSize="fontSizeS" style={{ color: '#67728A', marginTop: 8 }}>
            Connected fields: {connectedFieldsCount}
          </Text>
        </Flex>
      </Box>
      <Box
        style={{
          width: '100%',
          margin: '0 auto',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #e5ebed',
          padding: 24,
        }}>
        <Checkbox isChecked={allSelected} onChange={handleSelectAll} style={{ marginBottom: 16 }}>
          Select all fields
        </Checkbox>
        <Stack flexDirection="column" alignItems="flex-start" spacing="none">
          {fields.map((field) => {
            const mappedLocales = fieldLocaleMap[field.id] || [];
            return (
              <Checkbox
                key={field.id}
                isChecked={selectedFields.some((f) => f.id === field.id)}
                onChange={() => handleToggleField(field)}
                isDisabled={field.disabled}
                style={{
                  marginBottom: 8,
                  fontWeight: field.disabled ? 400 : 700,
                  color: field.disabled ? '#b3b3b3' : '#222',
                }}>
                <span style={{ fontWeight: 700, color: field.disabled ? '#b3b3b3' : '#222' }}>
                  {field.name}
                </span>
                <span style={{ marginLeft: 8, color: '#888', fontWeight: 400 }}>
                  ({field.type})
                </span>
                {mappedLocales.length > 0 && (
                  <span style={{ marginLeft: 8, color: '#007eb6', fontWeight: 400, fontSize: 12 }}>
                    ({mappedLocales.join(', ')})
                  </span>
                )}
              </Checkbox>
            );
          })}
        </Stack>
      </Box>
      <Flex justifyContent="flex-end" style={{ marginTop: 32 }}>
        <Button
          variant="secondary"
          onClick={handleClose}
          style={{ minWidth: 120, marginRight: 16 }}>
          Cancel
        </Button>
        {hasLocales ? (
          <Button
            variant="primary"
            onClick={() => setStep(2)}
            style={{ minWidth: 140 }}
            isDisabled={selectedFields.length === 0}>
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSaveAndSync}
            isLoading={isSyncing}
            style={{ minWidth: 140 }}
            isDisabled={selectedFields.length === 0}>
            Save and sync
          </Button>
        )}
      </Flex>
    </>
  );

  // Step 2: Locale selection UI
  const renderLocaleStep = () => (
    <>
      <Box style={{ marginBottom: 18 }}>
        <Text style={{ color: '#444' }}>Select the locales you want to reference in Klaviyo.</Text>
      </Box>
      <Text fontWeight="fontWeightMedium" style={{ marginBottom: 6, display: 'block' }}>
        Locales <span style={{ color: '#67728A' }}>(required)</span>
      </Text>
      <Box
        style={{
          width: '100%',
          margin: '0 auto',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #e5ebed',
          padding: 24,
          marginBottom: 24,
        }}>
        <Checkbox
          isChecked={allLocalesSelected}
          onChange={handleSelectAllLocales}
          style={{ marginBottom: 16 }}>
          Select all
        </Checkbox>
        <Stack flexDirection="column" alignItems="flex-start" spacing="none">
          {availableLocales.map((locale) => (
            <Checkbox
              key={locale.code}
              isChecked={selectedLocales.includes(locale.code)}
              onChange={() => handleToggleLocale(locale.code)}
              style={{ marginBottom: 8 }}>
              {locale.name} <span style={{ color: '#888', marginLeft: 8 }}>({locale.code})</span>
            </Checkbox>
          ))}
        </Stack>
      </Box>
      <Flex justifyContent="flex-end" style={{ marginTop: 32 }}>
        <Button variant="secondary" onClick={() => setStep(1)} style={{ marginRight: 16 }}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleSaveAndSync}
          isLoading={isSyncing}
          isDisabled={selectedLocales.length === 0}>
          Save and sync
        </Button>
      </Flex>
    </>
  );

  return (
    <Box
      padding="spacingXl"
      style={{
        minWidth: 480,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        position: 'relative',
      }}>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading>Connected fields</Heading>
        <Button
          variant="transparent"
          onClick={handleClose}
          startIcon={<span>x</span>}
          style={{ padding: 4 }}
        />
      </Flex>
      {step === 1 && renderFieldStep()}
      {step === 2 && hasLocales && renderLocaleStep()}
    </Box>
  );
};

export default FieldSelectDialog;
