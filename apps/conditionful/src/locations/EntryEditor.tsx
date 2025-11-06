/**
 * Entry Editor Location
 * 
 * Provides a custom tab in the Contentful Entry Editor for managing
 * conditional field visibility rules and displaying fields with real-time rule evaluation
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EditorAppSDK } from '@contentful/app-sdk';
import {
  Stack,
  Tabs,
  Box,
  Heading,
  Note,
  Spinner,
  Button,
  Flex,
} from '@contentful/f36-components';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { RulesPanel } from '../components/RulesEditor/RulesPanel';
import { FieldRenderer } from '../components/FieldRenderer';
import { Rule, FieldType, FieldValues } from '../types/rules';
import { getHiddenFields } from '../utils/rulesEngine';
import { SettingsService } from '../utils/settingsService';

const Entry = () => {
  const sdk = useSDK<EditorAppSDK>();
  const cma = useCMA();
  const contentTypeId = sdk.contentType.sys.id;

  // State for rules (loaded from settings entry)
  const [rules, setRules] = useState<Rule[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsService, setSettingsService] = useState<SettingsService | null>(null);

  // State for field values (for rule evaluation)
  const [fieldValues, setFieldValues] = useState<FieldValues>({});

  // Initialize settings service and load rules
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);
        
        const defaultLocale = sdk.locales.default;
        console.log('[Conditionful] Initializing settings service for content type:', contentTypeId);
        
        const service = new SettingsService({
          cma,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          defaultLocale,
        });

        await service.initialize();
        setSettingsService(service);

        // Load rules for this content type
        const allRules = await service.loadRules();
        console.log('[Conditionful] All rules loaded:', allRules);
        
        const rulesForContentType = allRules[contentTypeId] || [];
        console.log('[Conditionful] Rules for content type', contentTypeId, ':', rulesForContentType);
        console.log('[Conditionful] Number of rules:', rulesForContentType.length);
        
        setRules(rulesForContentType);
      } catch (error) {
        console.error('[Conditionful] Error initializing settings:', error);
        sdk.notifier.error('Failed to load rules configuration');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, [sdk, cma, contentTypeId]);

  // Get available fields from content type
  const availableFields = useMemo(() => {
    console.log('availableFields', sdk.contentType.fields)
    return sdk.contentType.fields
      .filter((field) => {
        // Only include supported field types
        const supportedTypes: FieldType[] = ['Symbol', 'Text', 'Integer', 'Number', 'Date', 'Boolean'];
        return supportedTypes.includes(field.type as FieldType);
      })
      .map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type as FieldType,
      }));
  }, [sdk.contentType.fields]);

  // Initialize field values and set up listeners
  useEffect(() => {
    const initialValues: FieldValues = {};
    const detachFunctions: Array<() => void> = [];

    console.log('[Conditionful] Setting up field value listeners');

    // Get initial values for all fields
    Object.entries(sdk.entry.fields).forEach(([fieldId, fieldApi]) => {
      try {
        const value = fieldApi.getValue();
        initialValues[fieldId] = value;
        console.log('[Conditionful] Initial field value:', fieldId, '=', value);

        // Listen for changes
        const detach = fieldApi.onValueChanged((newValue) => {
          console.log('[Conditionful] Field value changed:', fieldId, '=', newValue);
          setFieldValues((prev) => ({
            ...prev,
            [fieldId]: newValue,
          }));
        });
        detachFunctions.push(detach);
      } catch (error) {
        console.error(`[Conditionful] Error accessing field ${fieldId}:`, error);
      }
    });

    console.log('[Conditionful] All initial field values:', initialValues);
    setFieldValues(initialValues);

    // Cleanup listeners on unmount
    return () => {
      detachFunctions.forEach((detach) => detach());
    };
  }, [sdk.entry.fields]);

  // Calculate hidden fields based on current rules and field values
  const hiddenFieldIds = useMemo(() => {
    console.log('[Conditionful] Evaluating rules with:');
    console.log('  - Rules:', rules);
    console.log('  - Field values:', fieldValues);
    
    const hidden = getHiddenFields(rules, fieldValues);
    console.log('[Conditionful] Hidden fields:', Array.from(hidden));
    
    return hidden;
  }, [rules, fieldValues]);

  // Handle rules changes
  const handleRulesChange = useCallback((updatedRules: Rule[]) => {
    console.log('[Conditionful] Rules changed:', updatedRules);
    setRules(updatedRules);
    setHasUnsavedChanges(true);
  }, []);

  // Save rules to settings entry
  const handleSaveRules = useCallback(async () => {
    if (!settingsService) {
      sdk.notifier.error('Settings service not initialized');
      return;
    }

    try {
      setIsSaving(true);
      
      // Load current rules to get other content types' rules
      const allRules = await settingsService.loadRules();
      
      // Update rules for this content type
      const updatedRules = {
        ...allRules,
        [contentTypeId]: rules,
      };

      // Save to settings entry
      await settingsService.saveRules(updatedRules);
      
      sdk.notifier.success('Rules saved successfully!');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving rules:', error);
      sdk.notifier.error('Failed to save rules. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [settingsService, sdk, contentTypeId, rules]);

  // Handle field value changes
  const handleFieldChange = useCallback((fieldId: string, value: string | number | boolean | null) => {
    try {
      const fieldApi = sdk.entry.fields[fieldId];
      if (fieldApi) {
        if (value === null) {
          fieldApi.removeValue();
        } else {
          fieldApi.setValue(value);
        }
      }
    } catch (error) {
      console.error(`Error updating field ${fieldId}:`, error);
      sdk.notifier.error(`Failed to update field: ${fieldId}`);
    }
  }, [sdk.entry.fields, sdk.notifier]);

  if (isLoading) {
    return (
      <Box padding="spacingL">
        <Flex alignItems="center" justifyContent="center" style={{ minHeight: '200px' }}>
          <Spinner size="large" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box padding="spacingL">
      <Stack flexDirection="column" spacing="spacingL">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1">Conditionful - Field Visibility Rules</Heading>
          {hasUnsavedChanges && (
            <Button
              variant="positive"
              onClick={handleSaveRules}
              isLoading={isSaving}
              isDisabled={isSaving}
            >
              Save Rules
            </Button>
          )}
        </Flex>

        <Note variant="primary">
          Configure rules to conditionally show or hide fields based on other field values.
          Rules are evaluated in real-time as you edit field values.
        </Note>

        {hasUnsavedChanges && (
          <Note variant="warning">
            You have unsaved changes. Click "Save Rules" to persist your changes.
          </Note>
        )}

        <Tabs defaultTab="rules">
          <Tabs.List>
            <Tabs.Tab panelId="rules">Rules Configuration</Tabs.Tab>
            <Tabs.Tab panelId="fields">Field Preview</Tabs.Tab>
          </Tabs.List>

          {/* Rules Configuration Tab */}
          <Tabs.Panel id="rules">
            <Box paddingTop="spacingM">
              <RulesPanel
                rules={rules}
                availableFields={availableFields}
                onChange={handleRulesChange}
              />
            </Box>
          </Tabs.Panel>

          {/* Field Preview Tab */}
          <Tabs.Panel id="fields">
            <Box paddingTop="spacingM">
              <Stack flexDirection="column" spacing="spacingM">
                <Note variant="primary">
                  This preview shows how fields will appear based on the current rules.
                  Fields marked as "Hidden by rules" will be grayed out.
                </Note>

                {availableFields.length === 0 && (
                  <Note variant="warning">
                    No supported fields found in this content type.
                    Supported types: Text, Number, Date, Boolean.
                  </Note>
                )}

                {availableFields.map((field) => {
                  const fieldApi = sdk.entry.fields[field.id];
                  const isHidden = hiddenFieldIds.has(field.id);
                  const value = fieldValues[field.id];

                  return (
                    <FieldRenderer
                      key={field.id}
                      field={fieldApi}
                      fieldName={field.name}
                      fieldType={field.type}
                      isHidden={isHidden}
                      value={value}
                      onChange={(newValue) => handleFieldChange(field.id, newValue)}
                    />
                  );
                })}
              </Stack>
            </Box>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Box>
  );
};

export default Entry;
