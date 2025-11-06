/**
 * Entry Editor Location
 *
 * Provides a custom tab in the Contentful Entry Editor for managing
 * conditional field visibility rules and displaying fields with real-time rule evaluation
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EditorAppSDK } from '@contentful/app-sdk';
import { Stack, Box, Note, Spinner, Button, Flex } from '@contentful/f36-components';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { RulesPanel } from '../components/RulesEditor/RulesPanel';
import { Rule, FieldType } from '../types/rules';
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

  // Initialize settings service and load rules
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);

        const defaultLocale = sdk.locales.default;
        console.log(
          '[Conditionful] Initializing settings service for content type:',
          contentTypeId
        );

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
        console.log(
          '[Conditionful] Rules for content type',
          contentTypeId,
          ':',
          rulesForContentType
        );
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
    return sdk.contentType.fields
      .filter((field) => {
        // Only include supported field types
        const supportedTypes: FieldType[] = [
          'Symbol',
          'Text',
          'Integer',
          'Number',
          'Date',
          'Boolean',
        ];
        return supportedTypes.includes(field.type as FieldType);
      })
      .map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type as FieldType,
      }));
  }, [sdk.contentType.fields]);

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

  if (isLoading) {
    return (
      <Box style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <Flex alignItems="center" justifyContent="center" style={{ minHeight: '200px' }}>
          <Spinner size="large" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Stack flexDirection="column" spacing="spacingM">
        {/* Rules Panel */}
        <RulesPanel
          rules={rules}
          availableFields={availableFields}
          onChange={handleRulesChange}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSaveRules}
          isSaving={isSaving}
        />
      </Stack>
    </Box>
  );
};

export default Entry;
