import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import * as PhosphorIcons from '@phosphor-icons/react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Form,
  FormControl,
  Heading,
  Note,
  Paragraph,
  Pill,
  Select,
  Spinner,
  Stack,
  Switch,
  TextInput,
} from '@contentful/f36-components';
import { css } from 'emotion';
import ContentTypePicker from '../components/ContentTypePicker';
import { useIconCatalog } from '../hooks/useIconCatalog';
import type { IconWeight } from '../types/icon';
import { DEFAULT_ICON_POSITIONS, ICON_WEIGHT_LABELS, ICON_WEIGHTS } from '../types/icon';
import type {
  AppInstallationParameters,
  DialogInvocationParameters,
  IconAvailabilityMode,
} from '../types/parameters';
import {
  parseEnabledWeights,
  parsePositionOptions,
  parseSelectedIconNames,
  serializeEnabledWeights,
  serializePositionOptions,
  serializeSelectedIconNames,
} from '../types/parameters';
import { ensureUniqueFieldId, slugifyFieldId } from '../utils/contentTypes';

interface ContentTypeWithJsonFields {
  id: string;
  name: string;
  jsonFieldIds: string[];
  fields: Array<{ id: string; name: string; type: string }>;
}

interface InvalidStyleUsageSummary {
  entryCount: number;
  invalidStyles: IconWeight[];
}

const DEFAULT_INSTALLATION_PARAMETERS: Required<AppInstallationParameters> = {
  enabledWeights: ['regular'],
  selectedContentTypeIds: [],
  managedFieldId: 'phosphorIcon',
  managedFieldName: 'Phosphor icon',
  iconAvailabilityMode: 'all',
  selectedIconNames: [],
  positionOptions: DEFAULT_ICON_POSITIONS,
};

const styles = {
  page: css({
    width: '100%',
  }),
  pageInner: css({
    width: '900px',
    maxWidth: '100%',
    padding: '48px 24px 64px',
    boxSizing: 'border-box',
  }),
  section: css({
    width: '100%',
    maxWidth: '760px',
  }),
  fullWidth: css({
    width: '100%',
  }),
  stylePreview: css({
    width: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3b392d',
  }),
};

function getConfigureErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return 'Failed to apply Phosphor Icon to the selected content types.';
}

function isVersionMismatchError(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 409
  ) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : '';

  return message.toLowerCase().includes('version');
}

function extractInvalidStyleCount(
  fieldValue: unknown,
  allowedWeights: IconWeight[]
): InvalidStyleUsageSummary | null {
  const invalidStyles = new Set<IconWeight>();
  let entryCount = 0;

  const collect = (candidate: unknown) => {
    if (
      candidate &&
      typeof candidate === 'object' &&
      'weight' in candidate &&
      typeof (candidate as { weight?: unknown }).weight === 'string'
    ) {
      const weight = (candidate as { weight: string }).weight;
      if (
        ICON_WEIGHTS.includes(weight as IconWeight) &&
        !allowedWeights.includes(weight as IconWeight)
      ) {
        invalidStyles.add(weight as IconWeight);
        entryCount += 1;
      }
    }
  };

  if (
    fieldValue &&
    typeof fieldValue === 'object' &&
    'weight' in (fieldValue as Record<string, unknown>)
  ) {
    collect(fieldValue);
  } else if (fieldValue && typeof fieldValue === 'object') {
    Object.values(fieldValue as Record<string, unknown>).forEach(collect);
  }

  if (entryCount === 0) {
    return null;
  }

  return {
    entryCount,
    invalidStyles: Array.from(invalidStyles),
  };
}

function replaceInvalidStyles(
  fieldValue: unknown,
  replacementWeight: IconWeight,
  allowedWeights: IconWeight[]
) {
  const replace = (candidate: unknown) => {
    if (
      candidate &&
      typeof candidate === 'object' &&
      'weight' in candidate &&
      typeof (candidate as { weight?: unknown }).weight === 'string'
    ) {
      const weight = (candidate as { weight: string }).weight;
      if (
        ICON_WEIGHTS.includes(weight as IconWeight) &&
        !allowedWeights.includes(weight as IconWeight)
      ) {
        return {
          ...(candidate as Record<string, unknown>),
          weight: replacementWeight,
        };
      }
    }

    return candidate;
  };

  if (
    fieldValue &&
    typeof fieldValue === 'object' &&
    'weight' in (fieldValue as Record<string, unknown>)
  ) {
    return replace(fieldValue);
  }

  if (fieldValue && typeof fieldValue === 'object') {
    return Object.fromEntries(
      Object.entries(fieldValue as Record<string, unknown>).map(([locale, value]) => [
        locale,
        replace(value),
      ])
    );
  }

  return fieldValue;
}

function IconStyleOption({
  weight,
  isChecked,
  onChange,
}: {
  weight: IconWeight;
  isChecked: boolean;
  onChange: () => void;
}) {
  return (
    <Checkbox id={`weight-${weight}`} isChecked={isChecked} onChange={onChange}>
      <Flex alignItems="center" gap="spacingS">
        <Box className={styles.stylePreview}>
          <PhosphorIcons.PencilSimple size={20} weight={weight} />
        </Box>
        <span>{ICON_WEIGHT_LABELS[weight]}</span>
      </Flex>
    </Checkbox>
  );
}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK<AppInstallationParameters>>();
  const iconCatalog = useIconCatalog();

  const [enabledWeights, setEnabledWeights] = useState<IconWeight[]>(['regular']);
  const [contentTypes, setContentTypes] = useState<ContentTypeWithJsonFields[]>([]);
  const [selectedContentTypeIds, setSelectedContentTypeIds] = useState<string[]>([]);
  const [managedFieldName, setManagedFieldName] = useState(
    DEFAULT_INSTALLATION_PARAMETERS.managedFieldName
  );
  const [iconAvailabilityMode, setIconAvailabilityMode] = useState<IconAvailabilityMode>('all');
  const [selectedIconNames, setSelectedIconNames] = useState<string[]>([]);
  const [positionOptions, setPositionOptions] = useState<string[]>(DEFAULT_ICON_POSITIONS);
  const [newPositionOption, setNewPositionOption] = useState('');
  const [invalidStyleUsage, setInvalidStyleUsage] = useState<InvalidStyleUsageSummary | null>(null);
  const [applyStyleMigration, setApplyStyleMigration] = useState(false);
  const [replacementStyle, setReplacementStyle] = useState<IconWeight>('regular');
  const [isCheckingEntries, setIsCheckingEntries] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguration = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentParameters = (await sdk.app.getParameters()) ?? DEFAULT_INSTALLATION_PARAMETERS;
      const savedContentTypeIds = currentParameters.selectedContentTypeIds ?? [];

      setEnabledWeights(parseEnabledWeights(currentParameters.enabledWeights));
      setManagedFieldName(
        currentParameters.managedFieldName ?? DEFAULT_INSTALLATION_PARAMETERS.managedFieldName
      );
      setSelectedIconNames(parseSelectedIconNames(currentParameters.selectedIconNames));
      setIconAvailabilityMode(currentParameters.iconAvailabilityMode ?? 'all');
      setPositionOptions(parsePositionOptions(currentParameters.positionOptions));

      const response = (await sdk.cma.contentType.getMany({})) as {
        items?: Array<{
          name: string;
          sys: { id: string };
          fields?: Array<{ id: string; name: string; type: string }>;
        }>;
      };

      const availableContentTypes = (response.items ?? []).map((contentType) => {
        const jsonFieldIds = (contentType.fields ?? [])
          .filter((field) => field.type === 'Object')
          .map((field) => field.id);

        return {
          id: contentType.sys.id,
          name: contentType.name,
          jsonFieldIds,
          fields: contentType.fields ?? [],
        };
      });

      setContentTypes(availableContentTypes);
      setSelectedContentTypeIds(
        savedContentTypeIds.filter((contentTypeId) =>
          availableContentTypes.some((contentType) => contentType.id === contentTypeId)
        )
      );
    } catch (loadError) {
      console.error(loadError);
      setError('Failed to load content types and app configuration.');
    } finally {
      setIsLoading(false);
      sdk.app.setReady();
    }
  }, [sdk]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const toggleWeight = useCallback((weight: IconWeight) => {
    setEnabledWeights((currentWeights) =>
      currentWeights.includes(weight)
        ? currentWeights.filter((currentWeight) => currentWeight !== weight)
        : [...currentWeights, weight]
    );
  }, []);

  const pickerOptions = useMemo(() => {
    return contentTypes
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((contentType) => ({
        id: contentType.id,
        name: contentType.name,
      }));
  }, [contentTypes]);

  const normalizedPositionOptions = useMemo(() => {
    return parsePositionOptions(positionOptions);
  }, [positionOptions]);

  const addPositionOption = useCallback(() => {
    const normalizedValue = newPositionOption.trim();

    if (!normalizedValue || normalizedPositionOptions.includes(normalizedValue)) {
      setNewPositionOption('');
      return;
    }

    if (normalizedPositionOptions.length >= 10) {
      sdk.notifier.error('You can add up to 10 position options.');
      return;
    }

    setPositionOptions((currentOptions) => [...currentOptions, normalizedValue]);
    setNewPositionOption('');
  }, [newPositionOption, normalizedPositionOptions, sdk.notifier]);

  const removePositionOption = useCallback((positionOption: string) => {
    setPositionOptions((currentOptions) => {
      const nextOptions = currentOptions.filter(
        (currentOption) => currentOption !== positionOption
      );
      return nextOptions.length > 0 ? nextOptions : currentOptions;
    });
  }, []);

  const selectedIconOptionLabels = useMemo(() => {
    return selectedIconNames
      .map((iconName) => iconCatalog.find((icon) => icon.name === iconName)?.name ?? iconName)
      .sort((left, right) => left.localeCompare(right));
  }, [iconCatalog, selectedIconNames]);

  const openAllowedIconsDialog = useCallback(async () => {
    const dialogParams: DialogInvocationParameters = {
      mode: 'multi',
      enabledWeights,
      positionOptions: normalizedPositionOptions,
      selectedIconNames,
    };

    const result = await sdk.dialogs.openCurrentApp({
      title: 'Choose allowed icons',
      width: 'large',
      minHeight: 760,
      parameters: dialogParams,
    });

    if (Array.isArray(result)) {
      setSelectedIconNames(result);
    }
  }, [enabledWeights, normalizedPositionOptions, sdk.dialogs, selectedIconNames]);

  const summarizeInvalidStyleUsage = useCallback(async () => {
    if (selectedContentTypeIds.length === 0 || enabledWeights.length === 0) {
      setInvalidStyleUsage(null);
      return;
    }

    setIsCheckingEntries(true);

    try {
      const invalidStyles = new Set<IconWeight>();
      let entryCount = 0;

      for (const contentTypeId of selectedContentTypeIds) {
        const contentTypeDetails = (await sdk.cma.contentType.get({
          contentTypeId,
        })) as {
          fields: Array<{ id: string; name: string; type: string }>;
        };

        const editorInterface = (await sdk.cma.editorInterface.get({
          contentTypeId,
        })) as {
          controls?: Array<{
            fieldId: string;
            widgetId?: string;
            widgetNamespace?: string;
          }>;
        };

        const fieldName = managedFieldName.trim();
        const baseFieldId = slugifyFieldId(fieldName);
        const existingAppControl = (editorInterface.controls ?? []).find(
          (control) => control.widgetNamespace === 'app' && control.widgetId === sdk.ids.app
        );

        const managedField =
          contentTypeDetails.fields.find((field) => field.id === existingAppControl?.fieldId) ??
          contentTypeDetails.fields.find((field) => field.id === baseFieldId) ??
          contentTypeDetails.fields.find((field) => field.name === fieldName);

        if (!managedField) {
          continue;
        }

        let skip = 0;
        const limit = 100;

        while (true) {
          const entriesResponse = (await sdk.cma.entry.getMany({
            query: {
              content_type: contentTypeId,
              limit,
              skip,
            },
          })) as {
            items: Array<{ fields?: Record<string, unknown> }>;
            total?: number;
          };

          for (const entry of entriesResponse.items ?? []) {
            const summary = extractInvalidStyleCount(
              entry.fields?.[managedField.id],
              enabledWeights
            );
            if (!summary) {
              continue;
            }

            entryCount += summary.entryCount;
            summary.invalidStyles.forEach((style) => invalidStyles.add(style));
          }

          skip += entriesResponse.items?.length ?? 0;
          if (!entriesResponse.items?.length || skip >= (entriesResponse.total ?? 0)) {
            break;
          }
        }
      }

      setInvalidStyleUsage(
        entryCount > 0
          ? {
              entryCount,
              invalidStyles: Array.from(invalidStyles),
            }
          : null
      );
    } catch (scanError) {
      console.error(scanError);
      setInvalidStyleUsage(null);
    } finally {
      setIsCheckingEntries(false);
    }
  }, [enabledWeights, managedFieldName, sdk, selectedContentTypeIds]);

  useEffect(() => {
    summarizeInvalidStyleUsage();
  }, [summarizeInvalidStyleUsage]);

  useEffect(() => {
    if (!enabledWeights.includes(replacementStyle)) {
      setReplacementStyle(enabledWeights[0] ?? 'regular');
    }
  }, [enabledWeights, replacementStyle]);

  const applyStyleMigrationToEntries = useCallback(
    async (replacementWeight: IconWeight) => {
      for (const contentTypeId of selectedContentTypeIds) {
        const contentTypeDetails = (await sdk.cma.contentType.get({
          contentTypeId,
        })) as {
          fields: Array<{ id: string; name: string; type: string }>;
        };

        const editorInterface = (await sdk.cma.editorInterface.get({
          contentTypeId,
        })) as {
          controls?: Array<{
            fieldId: string;
            widgetId?: string;
            widgetNamespace?: string;
          }>;
        };

        const fieldName = managedFieldName.trim();
        const baseFieldId = slugifyFieldId(fieldName);
        const existingAppControl = (editorInterface.controls ?? []).find(
          (control) => control.widgetNamespace === 'app' && control.widgetId === sdk.ids.app
        );

        const managedField =
          contentTypeDetails.fields.find((field) => field.id === existingAppControl?.fieldId) ??
          contentTypeDetails.fields.find((field) => field.id === baseFieldId) ??
          contentTypeDetails.fields.find((field) => field.name === fieldName);

        if (!managedField) {
          continue;
        }

        let skip = 0;
        const limit = 100;

        while (true) {
          const entriesResponse = (await sdk.cma.entry.getMany({
            query: {
              content_type: contentTypeId,
              limit,
              skip,
            },
          })) as {
            items: Array<{
              sys: { id: string; version?: number; publishedVersion?: number };
              fields?: Record<string, unknown>;
            }>;
            total?: number;
          };

          for (const entry of entriesResponse.items ?? []) {
            const currentFieldValue = entry.fields?.[managedField.id];
            const summary = extractInvalidStyleCount(currentFieldValue, enabledWeights);

            if (!summary) {
              continue;
            }

            const updatedEntry = {
              ...entry,
              fields: {
                ...(entry.fields ?? {}),
                [managedField.id]: replaceInvalidStyles(
                  currentFieldValue,
                  replacementWeight,
                  enabledWeights
                ),
              },
            };

            const updateResult = (await sdk.cma.entry.update(
              { entryId: entry.sys.id },
              updatedEntry as never
            )) as { sys?: { version?: number; publishedVersion?: number } };

            if (entry.sys.publishedVersion && updateResult.sys?.version) {
              await sdk.cma.entry.publish({ entryId: entry.sys.id }, {
                sys: { version: updateResult.sys.version },
              } as never);
            }
          }

          skip += entriesResponse.items?.length ?? 0;
          if (!entriesResponse.items?.length || skip >= (entriesResponse.total ?? 0)) {
            break;
          }
        }
      }
    },
    [enabledWeights, managedFieldName, sdk, selectedContentTypeIds]
  );

  const applyContentTypeAssignments = useCallback(
    async (configParameters: AppInstallationParameters) => {
      const assignedFields = await Promise.all(
        contentTypes.map(async (contentType) => {
          const assignApp = configParameters.selectedContentTypeIds?.includes(contentType.id);
          let contentTypeDetails = (await sdk.cma.contentType.get({
            contentTypeId: contentType.id,
          })) as {
            name: string;
            fields: Array<{ id: string; name: string; type: string }>;
            sys?: { version?: number };
          };
          const getEditorInterface = async () =>
            (await sdk.cma.editorInterface.get({
              contentTypeId: contentType.id,
            })) as {
              controls?: Array<{
                fieldId: string;
                widgetId?: string;
                widgetNamespace?: string;
              }>;
              sys?: { version?: number };
            };

          let editorInterface = await getEditorInterface();
          const fieldName = configParameters.managedFieldName?.trim() ?? '';
          const baseFieldId = configParameters.managedFieldId ?? slugifyFieldId(fieldName);
          const existingAppControl = (editorInterface.controls ?? []).find(
            (control) => control.widgetNamespace === 'app' && control.widgetId === sdk.ids.app
          );

          let managedField =
            contentTypeDetails.fields.find((field) => field.id === existingAppControl?.fieldId) ??
            contentTypeDetails.fields.find((field) => field.id === baseFieldId) ??
            contentTypeDetails.fields.find((field) => field.name === fieldName);

          if (managedField && managedField.type !== 'Object') {
            throw new Error(
              `${contentTypeDetails.name} already has a field named "${fieldName}" that is not a JSON field.`
            );
          }

          if (assignApp && !managedField) {
            const newFieldId = ensureUniqueFieldId(
              baseFieldId,
              contentTypeDetails.fields.map((field) => field.id)
            );

            const updatedContentType = {
              ...contentTypeDetails,
              fields: [
                ...contentTypeDetails.fields,
                {
                  id: newFieldId,
                  name: fieldName,
                  type: 'Object',
                  localized: false,
                  required: false,
                  validations: [],
                  disabled: false,
                  omitted: false,
                },
              ],
            };

            const updatedResult = (await sdk.cma.contentType.update(
              { contentTypeId: contentType.id },
              updatedContentType as never
            )) as { sys?: { version?: number } };

            if (updatedResult.sys?.version) {
              await sdk.cma.contentType.publish({ contentTypeId: contentType.id }, {
                sys: { version: updatedResult.sys.version },
              } as never);
            }

            managedField = {
              id: newFieldId,
              name: fieldName,
              type: 'Object',
            };
          }

          if (assignApp && managedField && managedField.name !== fieldName) {
            const renamedContentType = {
              ...contentTypeDetails,
              fields: contentTypeDetails.fields.map((field) =>
                field.id === managedField!.id
                  ? {
                      ...field,
                      name: fieldName,
                    }
                  : field
              ),
            };

            const updatedResult = (await sdk.cma.contentType.update(
              { contentTypeId: contentType.id },
              renamedContentType as never
            )) as {
              fields: Array<{ id: string; name: string; type: string }>;
              sys?: { version?: number };
            };

            if (updatedResult.sys?.version) {
              await sdk.cma.contentType.publish({ contentTypeId: contentType.id }, {
                sys: { version: updatedResult.sys.version },
              } as never);
            }

            contentTypeDetails = updatedResult;
            managedField = {
              ...managedField,
              name: fieldName,
            };
          }

          const untouchedControls = (editorInterface.controls ?? []).filter((control) => {
            const isPhosphorControl =
              control.widgetNamespace === 'app' && control.widgetId === sdk.ids.app;
            const targetsManagedField =
              managedField !== undefined && control.fieldId === managedField.id;

            return !isPhosphorControl && !targetsManagedField;
          });

          const updatedControls =
            assignApp && managedField
              ? [
                  ...untouchedControls,
                  {
                    fieldId: managedField.id,
                    widgetId: sdk.ids.app,
                    widgetNamespace: 'app',
                  },
                ]
              : untouchedControls;

          const shouldRemoveManagedField =
            !assignApp &&
            managedField !== undefined &&
            existingAppControl?.fieldId === managedField.id;

          try {
            await sdk.cma.editorInterface.update({ contentTypeId: contentType.id }, {
              ...editorInterface,
              controls: updatedControls,
            } as never);
          } catch (updateError) {
            if (!isVersionMismatchError(updateError)) {
              throw updateError;
            }

            editorInterface = await getEditorInterface();
            await sdk.cma.editorInterface.update({ contentTypeId: contentType.id }, {
              ...editorInterface,
              controls: updatedControls,
            } as never);
          }

          if (shouldRemoveManagedField) {
            const refreshedContentType = (await sdk.cma.contentType.get({
              contentTypeId: contentType.id,
            })) as {
              fields: Array<{ id: string; name: string; type: string }>;
              sys?: { version?: number };
            };

            const omittedContentType = {
              ...refreshedContentType,
              fields: refreshedContentType.fields.map((field) =>
                field.id === managedField.id
                  ? {
                      ...field,
                      omitted: true,
                    }
                  : field
              ),
            };

            const omittedResult = (await sdk.cma.contentType.update(
              { contentTypeId: contentType.id },
              omittedContentType as never
            )) as { sys?: { version?: number } };

            if (omittedResult.sys?.version) {
              await sdk.cma.contentType.publish({ contentTypeId: contentType.id }, {
                sys: { version: omittedResult.sys.version },
              } as never);
            }

            const deletableContentType = (await sdk.cma.contentType.get({
              contentTypeId: contentType.id,
            })) as {
              fields: Array<{ id: string; name: string; type: string }>;
              sys?: { version?: number };
            };

            const updatedContentType = {
              ...deletableContentType,
              fields: deletableContentType.fields.filter((field) => field.id !== managedField.id),
            };

            const updatedResult = (await sdk.cma.contentType.update(
              { contentTypeId: contentType.id },
              updatedContentType as never
            )) as { sys?: { version?: number } };

            if (updatedResult.sys?.version) {
              await sdk.cma.contentType.publish({ contentTypeId: contentType.id }, {
                sys: { version: updatedResult.sys.version },
              } as never);
            }
          }

          return {
            contentTypeId: contentType.id,
            fieldId: assignApp && managedField ? managedField.id : null,
          };
        })
      );

      return assignedFields.reduce<Record<string, string[]>>((acc, assignment) => {
        acc[assignment.contentTypeId] = assignment.fieldId ? [assignment.fieldId] : [];
        return acc;
      }, {});
    },
    [contentTypes, sdk]
  );

  const onConfigure = useCallback(async () => {
    if (selectedContentTypeIds.length === 0) {
      sdk.notifier.error('Select at least one content type before installing.');
      return false;
    }

    if (enabledWeights.length === 0) {
      sdk.notifier.error('Select at least one icon style.');
      return false;
    }

    if (!managedFieldName.trim()) {
      sdk.notifier.error('Enter a field name for the field to create.');
      return false;
    }

    if (iconAvailabilityMode === 'specific' && selectedIconNames.length === 0) {
      sdk.notifier.error('Select at least one icon when using the specific-icons mode.');
      return false;
    }

    const normalizedManagedFieldName = managedFieldName.trim();
    const managedFieldId = slugifyFieldId(normalizedManagedFieldName);
    const parameters: AppInstallationParameters = {
      enabledWeights: serializeEnabledWeights(enabledWeights),
      selectedContentTypeIds,
      managedFieldId,
      managedFieldName: normalizedManagedFieldName,
      iconAvailabilityMode,
      selectedIconNames:
        iconAvailabilityMode === 'specific'
          ? serializeSelectedIconNames(selectedIconNames)
          : serializeSelectedIconNames([]),
      positionOptions: serializePositionOptions(normalizedPositionOptions),
    };

    try {
      if (applyStyleMigration && invalidStyleUsage) {
        await applyStyleMigrationToEntries(replacementStyle);
      }

      const assignedFields = await applyContentTypeAssignments(parameters);
      const currentState = await sdk.app.getCurrentState();
      const targetState = {
        EditorInterface: contentTypes.reduce<
          Record<string, { controls?: Array<{ fieldId: string }> }>
        >(
          (acc, contentType) => {
            const fields = assignedFields[contentType.id] ?? [];
            acc[contentType.id] =
              fields.length > 0 ? { controls: fields.map((fieldId) => ({ fieldId })) } : {};
            return acc;
          },
          {
            ...(currentState?.EditorInterface ?? {}),
          }
        ),
      };

      return {
        parameters,
        targetState,
      };
    } catch (configureError) {
      sdk.notifier.error(getConfigureErrorMessage(configureError));
      return false;
    }
  }, [
    applyContentTypeAssignments,
    applyStyleMigrationToEntries,
    contentTypes,
    enabledWeights,
    iconAvailabilityMode,
    applyStyleMigration,
    invalidStyleUsage,
    managedFieldName,
    normalizedPositionOptions,
    replacementStyle,
    sdk,
    selectedContentTypeIds,
    selectedIconNames,
  ]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [onConfigure, sdk]);

  if (isLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" padding="spacingXl">
        <FormControl.HelpText>Loading configuration…</FormControl.HelpText>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justifyContent="center" padding="spacingXl">
        <Note variant="negative">{error}</Note>
      </Flex>
    );
  }

  return (
    <Flex justifyContent="center" className={styles.page}>
      <Box className={styles.pageInner}>
        <Form>
          <Stack flexDirection="column" spacing="spacingXl" alignItems="stretch">
            <Box className={styles.section}>
              <Heading marginBottom="spacingS">Set up Phosphor Icon</Heading>
              <Paragraph marginBottom="none">
                Configure where the app appears, which icons editors can use, and how the picker
                should behave inside the entry field.
              </Paragraph>
            </Box>

            <Box className={styles.section}>
              <Heading as="h2" marginBottom="spacingS">
                Assign content types
              </Heading>
              <Paragraph marginBottom="spacingM">
                Select the content types that should receive the Phosphor Icon JSON field and app
                assignment automatically.
              </Paragraph>
              {pickerOptions.length === 0 ? (
                <Note variant="warning">No content types were found in this space yet.</Note>
              ) : (
                <FormControl>
                  <FormControl.Label>Content types</FormControl.Label>
                  <ContentTypePicker
                    contentTypes={pickerOptions}
                    selectedContentTypeIds={selectedContentTypeIds}
                    onSelectionChange={setSelectedContentTypeIds}
                  />
                </FormControl>
              )}
              <Box marginTop="spacingM">
                <FormControl className={styles.fullWidth}>
                  <FormControl.Label>Field name</FormControl.Label>
                  <TextInput
                    value={managedFieldName}
                    onChange={(event) => setManagedFieldName(event.target.value)}
                    placeholder="Phosphor icon"
                  />
                  <FormControl.HelpText>
                    Phosphor Icon will use this name for the field on each selected content type.
                  </FormControl.HelpText>
                </FormControl>
              </Box>
            </Box>

            <Box className={styles.section}>
              <Heading as="h2" marginBottom="spacingS">
                Set up rules
              </Heading>
              <Paragraph marginBottom="spacingM">
                Choose which icon styles and position options editors can use when they open the
                picker.
              </Paragraph>
              <Stack spacing="spacingL" flexDirection="column">
                <FormControl className={styles.fullWidth}>
                  <Box className={styles.fullWidth}>
                    <FormControl.Label>Icon style</FormControl.Label>
                    <FormControl.HelpText>
                      Choose which icon style options content editors can apply in the picker.
                    </FormControl.HelpText>
                    {invalidStyleUsage ? (
                      <Box marginTop="spacingS">
                        <Note variant="warning" title="Existing entries use disabled styles">
                          {invalidStyleUsage.entryCount} field value(s) currently use{' '}
                          {invalidStyleUsage.invalidStyles
                            .map((style) => ICON_WEIGHT_LABELS[style])
                            .join(', ')}
                          .
                          <Box marginTop="spacingM">
                            <Checkbox
                              id="apply-style-migration"
                              isChecked={applyStyleMigration}
                              onChange={(event) => setApplyStyleMigration(event.target.checked)}>
                              Apply an allowed style to existing entries that use disabled styles
                            </Checkbox>
                          </Box>
                          {applyStyleMigration ? (
                            <Box marginTop="spacingM">
                              <FormControl>
                                <FormControl.Label>Replacement style</FormControl.Label>
                                <Select
                                  value={replacementStyle}
                                  onChange={(event) =>
                                    setReplacementStyle(event.target.value as IconWeight)
                                  }>
                                  {enabledWeights.map((weight) => (
                                    <Select.Option key={weight} value={weight}>
                                      {ICON_WEIGHT_LABELS[weight]}
                                    </Select.Option>
                                  ))}
                                </Select>
                                <FormControl.HelpText>
                                  Existing entries using disabled styles will be updated to this
                                  style.
                                </FormControl.HelpText>
                              </FormControl>
                            </Box>
                          ) : null}
                        </Note>
                      </Box>
                    ) : null}
                    <Box marginTop="spacingS">
                      {ICON_WEIGHTS.map((weight) => (
                        <Box key={weight} marginBottom="spacingS">
                          <IconStyleOption
                            weight={weight}
                            isChecked={enabledWeights.includes(weight)}
                            onChange={() => toggleWeight(weight)}
                          />
                        </Box>
                      ))}
                    </Box>
                    {isCheckingEntries ? (
                      <Box marginTop="spacing2Xs">
                        <Flex alignItems="center" gap="spacing2Xs">
                          <Spinner size="small" />
                          <Paragraph marginBottom="none">
                            Checking existing entries for disabled styles...
                          </Paragraph>
                        </Flex>
                      </Box>
                    ) : null}
                  </Box>
                </FormControl>

                <FormControl className={styles.fullWidth}>
                  <Box className={styles.fullWidth}>
                    <FormControl.Label>Position options</FormControl.Label>
                    <FormControl.HelpText>
                      Define the position options available to content editors. Add up to 10
                      options. Click the × on a pill to remove it.
                    </FormControl.HelpText>
                    <Flex gap="spacingS" marginTop="spacingM" alignItems="flex-start">
                      <TextInput
                        value={newPositionOption}
                        onChange={(event) => setNewPositionOption(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addPositionOption();
                          }
                        }}
                        placeholder="Add position option..."
                        className={styles.fullWidth}
                      />
                      <Button
                        variant="secondary"
                        onClick={addPositionOption}
                        isDisabled={
                          !newPositionOption.trim() || normalizedPositionOptions.length >= 10
                        }>
                        Add
                      </Button>
                    </Flex>
                    <Box marginTop="spacingS">
                      <Flex gap="spacingXs" flexWrap="wrap">
                        {normalizedPositionOptions.map((positionOption) => (
                          <Pill
                            key={positionOption}
                            label={positionOption}
                            onClose={() => removePositionOption(positionOption)}
                          />
                        ))}
                      </Flex>
                    </Box>
                  </Box>
                </FormControl>
              </Stack>
            </Box>

            <Box className={styles.section}>
              <Heading as="h2" marginBottom="spacingS">
                Limit available icons
              </Heading>
              <Paragraph marginBottom="spacingM">
                Choose whether editors can search the full Phosphor library or only a curated set of
                icons.
              </Paragraph>
              <Flex alignItems="flex-start" gap="spacingM">
                <Switch
                  id="limit-available-icons"
                  isChecked={iconAvailabilityMode === 'specific'}
                  onChange={() =>
                    setIconAvailabilityMode((currentMode) =>
                      currentMode === 'specific' ? 'all' : 'specific'
                    )
                  }
                />
                <Box>
                  <Paragraph marginBottom="none" fontWeight="fontWeightDemiBold">
                    Limit icons before install
                  </Paragraph>
                  <Paragraph marginTop="none" marginBottom="none">
                    Enable a curated list of icons for editors. If disabled, Phosphor Icon keeps the
                    full icon library available.
                  </Paragraph>
                </Box>
              </Flex>

              {iconAvailabilityMode === 'specific' && (
                <Box marginTop="spacingM">
                  <Button variant="secondary" onClick={openAllowedIconsDialog}>
                    Choose allowed icons
                  </Button>
                  <Paragraph marginTop="spacingS" marginBottom="spacingS">
                    Selected icons are saved with this configuration and will appear again the next
                    time you edit the app settings.
                  </Paragraph>
                  {selectedIconOptionLabels.length > 0 ? (
                    <>
                      <Paragraph marginBottom="spacingXs">
                        {selectedIconOptionLabels.length} icon(s) selected
                      </Paragraph>
                      <Flex gap="spacingXs" flexWrap="wrap">
                        {selectedIconOptionLabels.map((iconName) => (
                          <Pill
                            key={iconName}
                            label={iconName}
                            onClose={() =>
                              setSelectedIconNames((currentNames) =>
                                currentNames.filter((currentName) => currentName !== iconName)
                              )
                            }
                          />
                        ))}
                      </Flex>
                    </>
                  ) : (
                    <Note variant="warning">
                      Choose at least one icon to finish this configuration.
                    </Note>
                  )}
                </Box>
              )}
            </Box>

            <Box className={styles.section}>
              <Heading as="h2" marginBottom="spacingS">
                Disclaimer
              </Heading>
              <Paragraph marginBottom="none">
                Size and color are intentionally left out of this app so presentation stays in your
                frontend implementation. The stored JSON includes the icon name, React component
                name, style, and position.
              </Paragraph>
            </Box>
          </Stack>
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
