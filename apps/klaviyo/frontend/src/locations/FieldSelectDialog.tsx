import React, { useEffect, useState, useRef } from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import {
  Box,
  Button,
  Flex,
  Checkbox,
  Note,
  Text,
  Stack,
  IconButton,
  Popover,
} from '@contentful/f36-components';
import { CloseIcon, ChevronDownIcon } from '@contentful/f36-icons';
import { SyncContent } from '../services/klaviyo-sync-service';
import { FieldMapping as BaseFieldMapping } from '../config/klaviyo';
import logger from '../utils/logger';
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';
import ReactDOM from 'react-dom';
import { markEntryForSyncViaApi } from '../utils/sync-api';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

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

// Helper to get spaceId from installation parameters or fallback to sdk.ids.space
const getEffectiveSpaceId = (sdk: DialogExtensionSDK): string | undefined => {
  return sdk.parameters?.installation?.spaceId || sdk.ids?.space;
};

export const FieldSelectDialog: React.FC<{ mappings?: FieldMapping[] }> = ({
  mappings: _mappings,
}) => {
  const sdk = useSDK<DialogExtensionSDK>();
  useAutoResizer();
  // Get entry from dialog parameters
  const entry = (sdk.parameters.invocation as any).entry;
  console.log('Dialog received entry:', entry);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<Field[]>([]);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [isLocaleDropdownOpen, setIsLocaleDropdownOpen] = useState(false);
  const localeDropdownRef = useRef<HTMLDivElement>(null);
  const [currentMappings, setCurrentMappings] = useState<FieldMapping[]>([]);

  // Get the parameters passed to this dialog
  const {
    fields: availableFields = [],
    preSelectedFields = [],
    showSyncButton = false,
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

  // Build a map from field ID to array of mapped locales
  const fieldLocaleMap: Record<string, string[]> = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    (currentMappings || []).forEach((m) => {
      if (!map[m.id]) map[m.id] = [];
      if (m.locale && !map[m.id].includes(m.locale)) {
        map[m.id].push(m.locale);
      }
    });
    return map;
  }, [currentMappings]);

  // Total connected fields = number of unique field IDs in mappings
  const connectedFieldsCount = React.useMemo(() => {
    const uniqueFieldIds = new Set((currentMappings || []).map((m) => m.id));
    return uniqueFieldIds.size;
  }, [currentMappings]);

  // A field is considered 'selected' if it is mapped in any locale
  const isFieldMapped = (fieldId: string) => (fieldLocaleMap[fieldId] || []).length > 0;

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
    if (isDropdownOpen) {
      sdk.window.updateHeight(4000);
    }
  }, [isDropdownOpen, sdk]);

  useEffect(() => {
    if (hasLocales && selectedLocales.length === 0) {
      setSelectedLocales([defaultLocale]);
    }
  }, [hasLocales, defaultLocale]);

  const filteredFields = fields.filter(
    (f) =>
      !selectedFields.some((sf) => sf.id === f.id) &&
      (f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase()))
  );

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

  const handleSaveSelections = async () => {
    if (contentTypeId && entryId) {
      const newMappings = selectedFields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        value: '',
        contentTypeId: contentTypeId,
        isAsset: field.type === 'Asset' || field.type === 'AssetLink' || false,
      }));
      await setEntryKlaviyoFieldMappings(sdk, entryId, newMappings);
    }
    sdk.close({ selectedFields: selectedFields.map((f) => f.id), success: true });
  };

  const handleSaveAndSync = async () => {
    setIsSyncing(true);
    try {
      if (contentTypeId && entryId) {
        let newMappings: any[] = [];
        selectedLocales.forEach((locale) => {
          selectedFields.forEach((field) => {
            newMappings.push({
              id: field.id,
              name: `${field.name}-${locale}`,
              type: field.type,
              value: '',
              contentTypeId: contentTypeId,
              isAsset: field.type === 'Asset' || field.type === 'AssetLink' || false,
              locale,
            });
          });
        });
        await setEntryKlaviyoFieldMappings(sdk, entryId, newMappings);
        // Prepare Klaviyo API keys from installation parameters
        const { klaviyoApiKey, klaviyoCompanyId } = sdk.parameters.installation || {};
        const privateKey = klaviyoApiKey;
        const publicKey = klaviyoCompanyId;
        // Send a proxy request for each mapping
        console.log('All entry fields:', entry.fields);
        for (const mapping of newMappings) {
          // Get the content from the entry field, using locale if available
          let content = '';
          if (entry && entry.fields && entry.fields[mapping.id]) {
            const fieldValue = entry.fields[mapping.id];
            console.log('Field value for mapping', mapping, fieldValue);
            if (typeof fieldValue === 'object' && fieldValue !== null) {
              // Strict: only use the selected locale, do not fall back
              if (
                mapping.locale &&
                fieldValue[mapping.locale] !== undefined &&
                fieldValue[mapping.locale] !== null &&
                fieldValue[mapping.locale] !== ''
              ) {
                const localeValue = fieldValue[mapping.locale];
                // If it's a Contentful rich text document, convert to HTML
                if (
                  localeValue &&
                  typeof localeValue === 'object' &&
                  localeValue.nodeType === 'document'
                ) {
                  content = documentToHtmlString(localeValue);
                } else {
                  content = localeValue;
                }
              } else {
                content = '';
              }
            } else if (typeof fieldValue === 'string') {
              content = fieldValue;
            }
          }
          // Block name includes locale
          const blockName = `${mapping.name} [ID:${entryId}-${mapping.name}]`;
          console.log('Searching for blockName:', blockName);
          // 1. Fetch all universal content blocks (no filter, page[size]=100)
          const idPattern = `[ID:${entryId}]`;
          let existingId: string | undefined = undefined;
          try {
            const allBlocksResult = await markEntryForSyncViaApi(
              entryId,
              contentTypeId,
              undefined,
              sdk,
              {
                endpoint: 'template-universal-content',
                method: 'GET',
                params: JSON.stringify({ 'page[size]': 100 }),
                privateKey,
                publicKey,
              }
            );
            console.log('Full proxy response (allBlocksResult):', allBlocksResult);
            // Use allBlocksResult.data directly as an array of blocks
            let blocks: any[] = [];
            if (
              allBlocksResult &&
              typeof allBlocksResult === 'object' &&
              'data' in allBlocksResult &&
              Array.isArray((allBlocksResult as any).data)
            ) {
              blocks = (allBlocksResult as any).data;
            }
            if (blocks.length > 0) {
              console.log('blocks', blocks);
              console.log('blockName', blockName);
              console.log(
                'blocks.attributes',
                blocks.map((b: any) => b.attributes)
              );
              const matches = blocks.filter(
                (block: any) => block.attributes && block.attributes.name === blockName
              );
              console.log('Matches:', matches);
              if (matches.length > 0) {
                existingId = matches[0].id;
              }
            }
          } catch (err) {
            console.error('Error fetching all Klaviyo content:', err);
          }
          // Build the Klaviyo payload after existingId is determined
          let klaviyoPayload;
          if (existingId) {
            // PATCH: include id
            klaviyoPayload = {
              data: {
                type: 'template-universal-content',
                id: existingId,
                attributes: {
                  name: blockName,
                  definition: {
                    content_type: 'block',
                    type: 'text', // or 'html' if needed
                    data: {
                      content: content || '',
                      styles: {
                        block_padding_bottom: 0,
                        block_padding_top: 0,
                        block_padding_right: 0,
                        block_padding_left: 0,
                      },
                      display_options: {},
                    },
                  },
                },
              },
            };
          } else {
            // POST: do not include id
            klaviyoPayload = {
              data: {
                type: 'template-universal-content',
                attributes: {
                  name: blockName,
                  definition: {
                    content_type: 'block',
                    type: 'text', // or 'html' if needed
                    data: {
                      content: content || '',
                      styles: {
                        block_padding_bottom: 0,
                        block_padding_top: 0,
                        block_padding_right: 0,
                        block_padding_left: 0,
                      },
                      display_options: {},
                    },
                  },
                },
              },
            };
          }
          if (existingId) {
            // 2. Exists: PATCH
            await markEntryForSyncViaApi(entryId, contentTypeId, undefined, sdk, {
              endpoint: `template-universal-content/${existingId}`,
              method: 'PATCH',
              data: JSON.stringify(klaviyoPayload), // Send as string for App Action
              params: JSON.stringify({}),
              privateKey,
              publicKey,
            });
          } else {
            // 3. Not found: POST
            await markEntryForSyncViaApi(entryId, contentTypeId, undefined, sdk, {
              endpoint: 'template-universal-content',
              method: 'POST',
              data: JSON.stringify(klaviyoPayload), // Send as string for App Action
              params: JSON.stringify({}),
              privateKey,
              publicKey,
            });
          }
        }
      }
      sdk.notifier.success('Fields successfully synced to Klaviyo!');
      // sdk.close({
      //   selectedFields: selectedFields.map((f) => f.id),
      //   selectedLocales,
      //   success: true,
      // });
    } catch (e) {
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
          style={{ minWidth: 120, marginRight: 16, color: '#d13438', borderColor: '#d13438' }}>
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
      }}>
      {step === 1 && renderFieldStep()}
      {step === 2 && hasLocales && renderLocaleStep()}
    </Box>
  );
};

export default FieldSelectDialog;
