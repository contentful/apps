/**
 * Field Location
 * 
 * Controls field visibility based on conditional rules.
 * Shows/hides fields using the rules engine.
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { Box, Spinner } from '@contentful/f36-components';
import { useSDK, useCMA, useAutoResizer } from '@contentful/react-apps-toolkit';
import { FieldValues } from '../types/rules';
import { isFieldHidden } from '../utils/rulesEngine';
import { SettingsService } from '../utils/settingsService';

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

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();
  useAutoResizer();

  const contentTypeId = sdk.contentType.sys.id;
  const currentFieldId = sdk.field.id;
  const fieldType = sdk.field.type;

  const [isLoading, setIsLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});

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
        const rulesForContentType = allRules[contentTypeId] || [];
        
        console.log('[Field] Rules loaded for content type:', contentTypeId, rulesForContentType);

        // Get all field values from the entry
        const initialValues: FieldValues = {};
        Object.entries(sdk.entry.fields).forEach(([fieldId, fieldApi]) => {
          try {
            const value = fieldApi.getValue();
            initialValues[fieldId] = value;
            console.log('[Field] Initial value for', fieldId, '=', value);
          } catch (error) {
            console.error('[Field] Error accessing field', fieldId, ':', error);
          }
        });

        setFieldValues(initialValues);

        // Check if current field should be hidden
        const hidden = isFieldHidden(currentFieldId, rulesForContentType, initialValues);
        console.log('[Field] Field', currentFieldId, 'is hidden:', hidden);
        setIsHidden(hidden);

        // Listen for field value changes
        Object.entries(sdk.entry.fields).forEach(([fieldId, fieldApi]) => {
          fieldApi.onValueChanged((newValue) => {
            console.log('[Field] Field value changed:', fieldId, '=', newValue);
            setFieldValues((prev) => {
              const updated = {
                ...prev,
                [fieldId]: newValue,
              };
              
              // Re-evaluate if current field should be hidden
              const nowHidden = isFieldHidden(currentFieldId, rulesForContentType, updated);
              console.log('[Field] Re-evaluated field', currentFieldId, 'is hidden:', nowHidden);
              setIsHidden(nowHidden);
              
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

    if (isHidden) {
      console.log('[Field] Rendering: Field is hidden by rules');
      return null; // Hide the field completely
    }

    console.log('[Field] Rendering: Field editor for type', fieldType);

    // Render appropriate field editor based on field type
    switch (fieldType) {
      case 'Symbol':
        return (
          <SingleLineEditor
            field={sdk.field}
            locales={sdk.locales}
            isInitiallyDisabled={false}
          />
        );

      case 'Text':
        return (
          <MultipleLineEditor
            field={sdk.field}
            locales={sdk.locales}
            isInitiallyDisabled={false}
          />
        );

      case 'Integer':
      case 'Number':
        return (
          <NumberEditor
            field={sdk.field}
            isInitiallyDisabled={false}
          />
        );

      case 'Date':
        return (
          <DateEditor
            field={sdk.field}
            isInitiallyDisabled={false}
          />
        );

      case 'Boolean':
        return (
          <BooleanEditor
            field={sdk.field}
            isInitiallyDisabled={false}
          />
        );

      default:
        console.warn('[Field] Unsupported field type:', fieldType);
        // Return null for unsupported types - let default editor handle it
        return null;
    }
  }, [isLoading, isHidden, fieldType, sdk.field, sdk.locales]);

  return (
    <Suspense fallback={<Spinner size="small" />}>
      {renderFieldEditor}
    </Suspense>
  );
};

export default Field;
