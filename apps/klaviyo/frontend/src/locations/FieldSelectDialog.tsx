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
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';
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
  const sdk = useSDK<DialogExtensionSDK>();
  useAutoResizer();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<Field[]>([]);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Get the parameters passed to this dialog
  const {
    fields: availableFields = [],
    preSelectedFields = [],
    showSyncButton = false,
    contentTypeId = '',
    entryId = '',
  } = (sdk.parameters.invocation as {
    fields?: Field[];
    preSelectedFields?: string[];
    showSyncButton?: boolean;
    contentTypeId?: string;
    entryId?: string;
  }) || {};

  useEffect(() => {
    // Debug: Log availableFields and preSelectedFields on dialog open
    logger.log('[FieldSelectDialog] availableFields:', availableFields);
    logger.log('[FieldSelectDialog] preSelectedFields:', preSelectedFields);
    if (availableFields && Array.isArray(availableFields)) {
      setFields(availableFields);
    }
    if (preSelectedFields && Array.isArray(preSelectedFields)) {
      setSelectedFields(availableFields.filter((f) => preSelectedFields.includes(f.id)));
    }
  }, [availableFields, preSelectedFields]);

  const filteredFields = fields.filter(
    (f) =>
      !selectedFields.some((sf) => sf.id === f.id) &&
      (f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddField = (field: Field) => {
    setSelectedFields((prev) => [...prev, field]);
  };

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields((prev) => prev.filter((f) => f.id !== fieldId));
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
      setSyncMessage(
        'Fields successfully synced to Klaviyo! You can continue editing or close the dialog.'
      );
    } catch (e) {
      setSyncMessage('Error syncing to Klaviyo');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    sdk.close({ selectedFields: selectedFields.map((f) => f.id), success: false });
  };

  return (
    <Box
      padding="spacingXl"
      style={{
        minWidth: 480,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      }}>
      {/* Section header */}
      <Text
        as="h3"
        fontWeight="fontWeightDemiBold"
        fontSize="fontSizeL"
        style={{ marginBottom: 12, marginTop: 12 }}>
        Select Fields to Map to Klaviyo
      </Text>
      <Text style={{ marginBottom: 18, color: '#444' }}>
        Select the fields you want to include in the Klaviyo sync:
      </Text>
      {/* Available Fields label */}
      <Text fontWeight="fontWeightMedium" style={{ marginBottom: 6, display: 'block' }}>
        Available Fields
      </Text>
      {/* Search input */}
      <input
        type="text"
        placeholder="Type to filter fields..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 6,
          border: '1px solid #DADADA',
          fontSize: 15,
          marginBottom: 10,
        }}
      />
      {/* Available fields list */}
      <Box
        style={{
          border: '1px solid #E5E5E5',
          borderRadius: 8,
          background: '#fff',
          maxHeight: 160,
          overflowY: 'auto',
          width: '100%',
          marginBottom: 28,
        }}>
        {filteredFields.length === 0 && (
          <Text fontColor="gray500" style={{ padding: 14 }}>
            No fields found
          </Text>
        )}
        {filteredFields.map((field) => (
          <Flex
            key={field.id}
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid #F0F0F0',
              cursor: 'pointer',
              alignItems: 'center',
              transition: 'background 0.2s',
            }}
            onClick={() => handleAddField(field)}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter') handleAddField(field);
            }}
            tabIndex={0}
            role="button"
            aria-label={`Add ${field.name}`}
            justifyContent="space-between">
            <Text style={{ fontSize: 16 }}>{field.name}</Text>
            <Text
              fontColor="gray500"
              fontSize="fontSizeS"
              style={{ marginLeft: 12, minWidth: 70, textAlign: 'right' }}>
              ({field.type})
            </Text>
          </Flex>
        ))}
      </Box>
      {/* Selected Fields label */}
      <Text fontWeight="fontWeightMedium" style={{ marginBottom: 6, display: 'block' }}>
        Selected Fields
      </Text>
      {/* Selected fields pills */}
      <Flex flexWrap="wrap" gap="spacingS" style={{ marginBottom: 32 }}>
        {selectedFields.length === 0 && <Text fontColor="gray500">No fields selected</Text>}
        {selectedFields.map((field) => (
          <Flex
            key={field.id}
            alignItems="center"
            style={{
              background: '#f5f6fa',
              borderRadius: 24,
              padding: '7px 18px 7px 14px',
              marginRight: 10,
              marginBottom: 10,
              fontSize: 15,
              fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}>
            <Text style={{ marginRight: 8 }}>{field.name}</Text>
            <Text fontColor="gray500" fontSize="fontSizeS" style={{ marginRight: 10 }}>
              ({field.type})
            </Text>
            <Button
              variant="transparent"
              size="small"
              aria-label={`Remove ${field.name}`}
              onClick={() => handleRemoveField(field.id)}
              style={{ padding: 0, minWidth: 22, fontSize: 18, color: '#888', marginLeft: 2 }}>
              ×
            </Button>
          </Flex>
        ))}
      </Flex>
      {/* Success/Error message */}
      {syncMessage && (
        <Note
          variant={syncMessage.includes('Error') ? 'negative' : 'positive'}
          style={{ marginBottom: 28 }}>
          {syncMessage}
        </Note>
      )}
      {/* Button row */}
      <Flex justifyContent="space-between">
        <Button variant="secondary" onClick={handleClose} style={{ minWidth: 100 }}>
          Close
        </Button>
        <Flex justifyContent="flex-end" alignItems="center" gap="spacingM">
          <Button variant="positive" onClick={handleSaveSelections}>
            Save Selections
          </Button>
          <Button variant="primary" onClick={handleSaveAndSync} isLoading={isSyncing}>
            Save & Sync to Klaviyo
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default FieldSelectDialog;
