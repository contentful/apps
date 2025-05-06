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
} from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { SyncContent } from '../services/klaviyo-sync-service';
import { FieldMapping } from '../config/klaviyo';
import logger from '../utils/logger';
import { saveLocalMappings } from '../utils/sync-api';
import { getLocalMappings } from '../services/persistence-service';
import ReactDOM from 'react-dom';

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
}

// Helper to get spaceId from installation parameters or fallback to sdk.ids.space
const getEffectiveSpaceId = (sdk: DialogExtensionSDK): string | undefined => {
  return sdk.parameters?.installation?.spaceId || sdk.ids?.space;
};

export const FieldSelectDialog: React.FC<{ entry: any; mappings: FieldMapping[] }> = ({
  entry,
  mappings,
}) => {
  useAutoResizer();
  const sdk = useSDK<DialogExtensionSDK>();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [blockNames, setBlockNames] = useState<Record<string, string>>({});
  const [editingBlock, setEditingBlock] = useState<string | null>(null);

  // Get the parameters passed to this dialog
  const {
    fields: availableFields = [],
    preSelectedFields = [],
    showSyncButton = false,
    contentTypeId = '',
    currentEntry = '',
  } = (sdk.parameters.invocation as {
    fields?: Field[];
    preSelectedFields?: string[];
    showSyncButton?: boolean;
    contentTypeId?: string;
    currentEntry?: string;
  }) || {};

  useEffect(() => {
    // Initialize fields and preselections
    if (availableFields && Array.isArray(availableFields)) {
      setFields(availableFields);
    }

    // Try to load mappings from localStorage for this contentTypeId
    let localMappings: any[] = [];
    try {
      localMappings = getLocalMappings();
      console.log('Dialog: loaded localMappings from localStorage:', localMappings);
    } catch (e) {
      console.log('error getting local mappings', e);
      localMappings = [];
    }
    const currentTypeMappings = contentTypeId
      ? localMappings.filter((m) => m.contentTypeId === contentTypeId)
      : [];
    if (currentTypeMappings.length > 0) {
      // Preselect fields and block names from local mappings
      setSelectedFields(currentTypeMappings.map((m) => m.contentfulFieldId || m.id));
      const blockNamesObj: Record<string, string> = {};
      currentTypeMappings.forEach((m) => {
        blockNamesObj[m.contentfulFieldId || m.id] =
          m.klaviyoBlockName || m.name || m.contentfulFieldId || m.id;
      });
      setBlockNames(blockNamesObj);
    } else if (preSelectedFields && Array.isArray(preSelectedFields)) {
      setSelectedFields(preSelectedFields);
    }

    // Set dialog size
    sdk.window.updateHeight(500);
  }, [sdk.parameters.invocation]);

  // Ensure the dialog always returns the latest mappings on close
  useEffect(() => {
    const originalClose = sdk.close;
    const handleClose = () => {
      const newMappings = selectedFields.map((fieldId) => {
        const field = fields.find((f) => f.id === fieldId);
        const mappingContentTypeId = contentTypeId || '';
        return {
          id: fieldId,
          name: field?.name || fieldId,
          type: field?.type || 'Text',
          value: '',
          contentTypeId: mappingContentTypeId,
          isAsset: field?.type === 'Asset' || field?.type === 'AssetLink' || false,
        };
      });
      return {
        selectedFields,
        mappings: newMappings,
        success: true,
      };
    };
    sdk.close = function () {
      console.log('closing dialog', handleClose());
      return originalClose.call(this, handleClose());
    };
    return () => {
      sdk.close = originalClose;
    };
  }, [sdk, selectedFields, fields, contentTypeId]);

  return (
    <Box padding="spacingL" style={{ minWidth: 480, maxWidth: 600 }}>
      {/* Description */}
      <Text style={{ marginBottom: 20 }}>
        Select the fields you would like to generate into Universal Content. Referenced fields are
        not available in this list.
      </Text>
      {/* Step 1: Field selection */}
      {step === 1 && (
        <>
          <Box style={{ width: '100%', marginBottom: 20, position: 'relative' }}>
            <Text fontWeight="fontWeightMedium" style={{ marginBottom: 4 }}>
              Select fields
            </Text>
            <CustomFieldDropdown
              fields={fields}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
            />
          </Box>
          <Flex style={{ width: '100%', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              variant="primary"
              onClick={() => {
                // Initialize block names for selected fields
                const newBlockNames: Record<string, string> = {};
                selectedFields.forEach((fieldId) => {
                  const field = fields.find((f) => f.id === fieldId);
                  newBlockNames[fieldId] = field
                    ? `${contentTypeId}.${field.name.replace(/\s+/g, '')}`
                    : fieldId;
                });
                setBlockNames(newBlockNames);
                setStep(2);
              }}
              isDisabled={selectedFields.length === 0}>
              Next
            </Button>
          </Flex>
        </>
      )}
      {/* Step 2: Content Block name editing */}
      {step === 2 && (
        <>
          {/* Content Block name editing */}
          {selectedFields.map((fieldId) => (
            <Box key={fieldId} style={{ marginBottom: 20 }}>
              <Text fontWeight="fontWeightMedium" style={{ marginBottom: 4, display: 'block' }}>
                Content Block name
              </Text>
              <Flex
                alignItems="center"
                style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: '12px 16px',
                }}>
                {editingBlock === fieldId ? (
                  <input
                    type="text"
                    value={blockNames[fieldId]}
                    onChange={(e) => setBlockNames({ ...blockNames, [fieldId]: e.target.value })}
                    onBlur={() => setEditingBlock(null)}
                    autoFocus
                    style={{
                      flex: 1,
                      fontSize: 16,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                    }}
                  />
                ) : (
                  <Text style={{ flex: 1, fontSize: 16 }}>{blockNames[fieldId]}</Text>
                )}
                <IconButton
                  aria-label="Edit block name"
                  icon={
                    <svg width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M13.5 2.75a1.768 1.768 0 0 1 2.5 2.5l-8.25 8.25-3 0.5 0.5-3 8.25-8.25Z"
                        stroke="#888"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  variant="transparent"
                  onClick={() => setEditingBlock(fieldId)}
                  style={{ marginLeft: 8 }}
                />
              </Flex>
            </Box>
          ))}
          <Flex style={{ width: '100%', justifyContent: 'space-between', gap: 8 }}>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Build new mappings for this content type
                const newMappings = selectedFields.map((fieldId) => {
                  const field = fields.find((f) => f.id === fieldId);
                  return {
                    id: fieldId,
                    name: field?.name || fieldId,
                    contentfulFieldId: fieldId,
                    klaviyoBlockName: blockNames[fieldId],
                    fieldType: field?.type || 'Text',
                    contentTypeId: contentTypeId || '',
                  };
                });
                // Merge with existing mappings for other content types
                let allMappings = getLocalMappings();
                // Remove old mappings for this content type
                allMappings = allMappings.filter((m) => m.contentTypeId !== (contentTypeId || ''));
                // Add new mappings for this content type
                const updatedMappings = [...allMappings, ...newMappings];
                console.log('Dialog: saving updatedMappings to localStorage:', updatedMappings);
                saveLocalMappings(updatedMappings);
                // Broadcast update to parent window so Sidebar/Page can update their state
                window.parent.postMessage(
                  {
                    type: 'updateFieldMappings',
                    fieldMappings: updatedMappings,
                  },
                  '*'
                );
                sdk.close({
                  mappings: newMappings,
                  success: true,
                });
              }}>
              Send to Klaviyo
            </Button>
          </Flex>
        </>
      )}
      {/* Sync message */}
      {syncMessage && (
        <Note
          variant={syncMessage.includes('Error') ? 'negative' : 'positive'}
          style={{ marginBottom: 16 }}>
          {syncMessage}
        </Note>
      )}
    </Box>
  );
};

// Custom dropdown component for field selection
function CustomFieldDropdown({
  fields,
  selectedFields,
  setSelectedFields,
}: {
  fields: { id: string; name: string; type: string }[];
  selectedFields: string[];
  setSelectedFields: (fields: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 300 });

  // Recalculate position
  const updatePosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  const filteredFields = fields.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = selectedFields.length === fields.length && fields.length > 0;
  const someSelected = selectedFields.length > 0 && selectedFields.length < fields.length;

  const dropdownMenu = (
    <Box
      style={{
        position: 'absolute',
        zIndex: 99999,
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        background: '#fff',
        border: '1px solid #DADADA',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: 0,
        marginTop: 4,
      }}>
      <Box style={{ padding: 8, borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: 6,
            borderRadius: 4,
            border: '1px solid #eee',
            fontSize: 14,
          }}
        />
      </Box>
      <Box style={{ maxHeight: 220, overflowY: 'auto', padding: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8, fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={() => {
              if (allSelected) setSelectedFields([]);
              else setSelectedFields(fields.map((f) => f.id));
            }}
            style={{ marginRight: 8 }}
          />
          Select all
        </label>
        {filteredFields.map((field) => (
          <label
            key={field.id}
            style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: 400 }}>
            <input
              type="checkbox"
              checked={selectedFields.includes(field.id)}
              onChange={() => {
                if (selectedFields.includes(field.id)) {
                  setSelectedFields(selectedFields.filter((id) => id !== field.id));
                } else {
                  setSelectedFields([...selectedFields, field.id]);
                }
              }}
              style={{ marginRight: 8 }}
            />
            {field.name.replace(/\b\w/g, (c) => c.toUpperCase())}
          </label>
        ))}
        {filteredFields.length === 0 && (
          <Text fontColor="gray500" style={{ padding: 8 }}>
            No fields found
          </Text>
        )}
      </Box>
    </Box>
  );

  return (
    <Box style={{ position: 'relative' }} ref={dropdownRef}>
      <Button
        variant="secondary"
        style={{
          width: '100%',
          justifyContent: 'space-between',
          textAlign: 'left',
          background: '#FAFAFA',
          border: '1px solid #DADADA',
          color: '#888',
          fontSize: '15px',
          borderRadius: 6,
        }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}>
        {selectedFields.length === 0 ? 'Select one or more' : `${selectedFields.length} selected`}
        <span style={{ float: 'right', marginLeft: 8 }}>
          <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 6l4 4 4-4"
              stroke="#888"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Button>
      {open && ReactDOM.createPortal(dropdownMenu, document.body)}
    </Box>
  );
}

export default FieldSelectDialog;
