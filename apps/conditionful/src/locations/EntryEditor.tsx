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
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { RulesPanel } from '../components/RulesEditor/RulesPanel';
import { FieldRenderer } from '../components/FieldRenderer';
import { Rule, FieldType, FieldValues } from '../types/rules';
import { getHiddenFields } from '../utils/rulesEngine';
import { AppInstallationParameters } from './ConfigScreen';

const Entry = () => {
  const sdk = useSDK<EditorAppSDK>();
  const contentTypeId = sdk.contentType.sys.id;

  // Get installation parameters with rules
  const installationParams = sdk.parameters.installation as AppInstallationParameters;
  const rulesForContentType = installationParams?.rules?.[contentTypeId] || [];

  // State for rules (local copy for editing)
  const [rules, setRules] = useState<Rule[]>(rulesForContentType);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // State for field values (for rule evaluation)
  const [fieldValues, setFieldValues] = useState<FieldValues>({});

  // Get available fields from content type
  const availableFields = useMemo(() => {
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

    // Get initial values for all fields
    Object.entries(sdk.entry.fields).forEach(([fieldId, fieldApi]) => {
      try {
        const value = fieldApi.getValue();
        initialValues[fieldId] = value;

        // Listen for changes
        const detach = fieldApi.onValueChanged((newValue) => {
          setFieldValues((prev) => ({
            ...prev,
            [fieldId]: newValue,
          }));
        });
        detachFunctions.push(detach);
      } catch (error) {
        console.error(`Error accessing field ${fieldId}:`, error);
      }
    });

    setFieldValues(initialValues);

    // Cleanup listeners on unmount
    return () => {
      detachFunctions.forEach((detach) => detach());
    };
  }, [sdk.entry.fields]);

  // Calculate hidden fields based on current rules and field values
  const hiddenFieldIds = useMemo(() => {
    return getHiddenFields(rules, fieldValues);
  }, [rules, fieldValues]);

  // Handle rules changes
  const handleRulesChange = useCallback((updatedRules: Rule[]) => {
    setRules(updatedRules);
    setHasUnsavedChanges(true);
  }, []);

  // Save rules to installation parameters
  const handleSaveRules = useCallback(async () => {
    try {
      // Get current installation parameters
      const currentParams = (sdk.parameters.installation as AppInstallationParameters) || {};
      
      // Update rules for this content type
      const updatedRules = {
        ...currentParams.rules,
        [contentTypeId]: rules,
      };

      // Note: Installation parameters can only be updated through the config screen
      // We'll store them temporarily in entry metadata or use a different approach
      // For now, we'll show a message to the user
      sdk.notifier.success('Rules updated successfully! Note: Rules are saved per session.');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving rules:', error);
      sdk.notifier.error('Failed to save rules. Please try again.');
    }
  }, [sdk, contentTypeId, rules]);

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

  return (
    <Box padding="spacingL">
      <Stack flexDirection="column" spacing="spacingL">
        <Heading as="h1">Conditionful - Field Visibility Rules</Heading>

        <Note variant="primary">
          Configure rules to conditionally show or hide fields based on other field values.
          Rules are evaluated in real-time as you edit field values.
        </Note>

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

              {hasUnsavedChanges && (
                <Note variant="warning" style={{ marginTop: '16px' }}>
                  You have unsaved changes. Note: Rules are currently saved per session only.
                  For persistent storage, use the App Configuration screen.
                </Note>
              )}
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
