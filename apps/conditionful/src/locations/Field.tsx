/**
 * Field Location
 *
 * Controls field visibility based on conditional rules.
 * Shows/hides fields using the rules engine.
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { Box, Spinner, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { i18n } from '@lingui/core';
import { FieldValues, Rule } from '../types/rules';
import { getFieldHidingRules } from '../utils/rulesEngine';
import { SettingsService } from '../utils/settingsService';

// Initialize Lingui for field editors that require it (like reference editor)
if (!i18n.locale) {
  i18n.load('en', {});
  i18n.activate('en');
}

// Lazy load field editors
const BooleanEditor = lazy(() =>
  import('@contentful/field-editor-boolean').then((m) => ({
    default: m.BooleanEditor,
  }))
);

const DateEditor = lazy(() =>
  import('@contentful/field-editor-date').then((m) => ({
    default: m.DateEditor,
  }))
);

const NumberEditor = lazy(() =>
  import('@contentful/field-editor-number').then((m) => ({
    default: m.NumberEditor,
  }))
);

const SingleLineEditor = lazy(() =>
  import('@contentful/field-editor-single-line').then((m) => ({
    default: m.SingleLineEditor,
  }))
);

const MultipleLineEditor = lazy(() =>
  import('@contentful/field-editor-multiple-line').then((m) => ({
    default: m.MultipleLineEditor,
  }))
);

const SingleEntryReferenceEditor = lazy(() =>
  import('@contentful/field-editor-reference').then((m) => ({
    default: m.SingleEntryReferenceEditor,
  }))
);

const MultipleEntryReferenceEditor = lazy(() =>
  import('@contentful/field-editor-reference').then((m) => ({
    default: m.MultipleEntryReferenceEditor,
  }))
);

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();

  // Start auto-resizer for proper iframe height management (especially for dropdowns)
  React.useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  const contentTypeId = sdk.contentType.sys.id;
  const currentFieldId = sdk.field.id;
  const fieldType = sdk.field.type;

  const [isLoading, setIsLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [hidingRules, setHidingRules] = useState<Rule[]>([]);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [rulesForContentType, setRulesForContentType] = useState<Rule[]>([]);

  // Initialize and load rules
  useEffect(() => {
    const initializeRules = async () => {
      try {
        console.log('[Field] Initializing for field:', currentFieldId, 'type:', fieldType);

        const defaultLocale = sdk.locales.default;
        const settingsService = new SettingsService({
          cma,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          defaultLocale,
        });

        await settingsService.initialize();
        const allRules = await settingsService.loadRules();
        const rules = allRules[contentTypeId] || [];
        setRulesForContentType(rules);

        console.log(
          '[Conditionful] Rules loaded:',
          rules.length,
          'rules for content type:',
          contentTypeId
        );

        // Get all field values from the entry
        const initialValues: FieldValues = {};
        Object.entries(sdk.entry.fields).forEach(([fieldId, fieldApi]) => {
          try {
            const value = fieldApi.getValue();
            initialValues[fieldId] = value;
          } catch (error) {
            console.error('[Conditionful] Error accessing field', fieldId, ':', error);
          }
        });

        setFieldValues(initialValues);

        // Check if current field should be hidden and get which rules are hiding it
        const { isHidden: hidden, hidingRules: hiding } = getFieldHidingRules(
          currentFieldId,
          rules,
          initialValues
        );

        setIsHidden(hidden);
        setHidingRules(hiding);

        // Listen for field value changes
        Object.entries(sdk.entry.fields).forEach(([fieldId, fieldApi]) => {
          fieldApi.onValueChanged((newValue) => {
            setFieldValues((prev) => {
              const updated = {
                ...prev,
                [fieldId]: newValue,
              };

              // Re-evaluate if current field should be hidden and get which rules are hiding it
              const { isHidden: nowHidden, hidingRules: nowHiding } = getFieldHidingRules(
                currentFieldId,
                rules,
                updated
              );

              setIsHidden(nowHidden);
              setHidingRules(nowHiding);

              return updated;
            });
          });
        });

        setIsLoading(false);
      } catch (error) {
        console.error('[Field] Error initializing rules:', error);
        setIsLoading(false);
      }
    };

    initializeRules();
  }, [sdk, cma, contentTypeId, currentFieldId, fieldType]);

  // Render field editor based on type
  const renderFieldEditor = useMemo(() => {
    if (isLoading) {
      return (
        <Box padding="spacingS">
          <Spinner size="small" />
        </Box>
      );
    }

    console.log('[Field] Rendering: Field editor for type', fieldType, 'isHidden:', isHidden);

    // Render appropriate field editor based on field type
    let fieldEditor;
    switch (fieldType) {
      case 'Symbol':
        fieldEditor = (
          <SingleLineEditor
            field={sdk.field}
            locales={sdk.locales}
            isInitiallyDisabled={isHidden}
          />
        );
        break;

      case 'Text':
        fieldEditor = (
          <MultipleLineEditor
            field={sdk.field}
            locales={sdk.locales}
            isInitiallyDisabled={isHidden}
          />
        );
        break;

      case 'Integer':
      case 'Number':
        fieldEditor = <NumberEditor field={sdk.field} isInitiallyDisabled={isHidden} />;
        break;

      case 'Date':
        fieldEditor = <DateEditor field={sdk.field} isInitiallyDisabled={isHidden} />;
        break;

      case 'Boolean':
        fieldEditor = <BooleanEditor field={sdk.field} isInitiallyDisabled={isHidden} />;
        break;

      case 'Link':
        fieldEditor = (
          <div style={{ minHeight: 150 }}>
            <SingleEntryReferenceEditor
              sdk={sdk}
              viewType="card"
              hasCardEditActions
              isInitiallyDisabled={isHidden}
              parameters={{
                instance: {
                  showCreateEntityAction: true,
                  showLinkEntityAction: true,
                },
              }}
            />
          </div>
        );
        break;

      case 'Array': {
        // Check if this is an array of references (links)
        const fieldDefinition = sdk.contentType.fields.find((f) => f.id === currentFieldId);
        const isReferenceArray =
          fieldDefinition?.items?.type === 'Link' && fieldDefinition?.items?.linkType === 'Entry';

        if (isReferenceArray) {
          fieldEditor = (
            <div style={{ minHeight: 150 }}>
              <MultipleEntryReferenceEditor
                sdk={sdk}
                viewType="card"
                hasCardEditActions
                hasCardRemoveActions
                isInitiallyDisabled={isHidden}
                parameters={{
                  instance: {
                    showCreateEntityAction: true,
                    showLinkEntityAction: true,
                  },
                }}
              />
            </div>
          );
        } else {
          // Not a reference array, let default editor handle it
          console.warn('[Field] Array field is not a reference array:', currentFieldId);
          return null;
        }
        break;
      }

      default:
        console.warn('[Field] Unsupported field type:', fieldType);
        // Return null for unsupported types - let default editor handle it
        return null;
    }

    // Wrap the field editor with disabled styling if hidden by rules
    if (isHidden) {
      const ruleNames = hidingRules.map((r) => r.name).join(', ');
      const message =
        hidingRules.length === 1
          ? `⚠️ Hidden by rule: "${ruleNames}"`
          : `⚠️ Hidden by rules: ${ruleNames}`;

      return (
        <Box
          style={{
            opacity: 0.5,
            pointerEvents: 'none',
            backgroundColor: tokens.gray100,
            borderRadius: tokens.borderRadiusMedium,
            padding: tokens.spacingXs,
            transition: 'opacity 0.2s ease-in-out',
          }}>
          <Text
            fontSize="fontSizeS"
            fontColor="gray500"
            marginBottom="spacingXs"
            fontWeight="fontWeightDemiBold">
            {message}
          </Text>
          {fieldEditor}
        </Box>
      );
    }

    return fieldEditor;
  }, [isLoading, isHidden, hidingRules, fieldType, sdk.field, sdk.locales]);

  return <Suspense fallback={<Spinner size="small" />}>{renderFieldEditor}</Suspense>;
};

export default Field;
