import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Box,
  Flex,
  Form,
  FormControl,
  Heading,
  Note,
  Paragraph,
  Select,
  Spinner,
  Stack,
  Switch,
  TextInput,
} from '@contentful/f36-components';
import ContentTypePicker from '../components/ContentTypePicker';
import DayRow from '../components/DayRow';
import {
  AppInstallationParameters,
  ClockFormat,
  DEFAULT_HOURS,
  DAYS_OF_WEEK,
  DayHours,
  DayOfWeek,
  HoursOfOperation,
} from '../types';
import { ensureUniqueFieldId, slugifyFieldId } from '../utils/contentTypes';
import { cloneHours, normalizeHours } from '../utils/hours';

interface ContentTypeWithJsonFields {
  id: string;
  name: string;
  jsonFieldIds: string[];
  fields: Array<{ id: string; name: string; type: string }>;
}

const DEFAULT_INSTALLATION_PARAMETERS: Required<AppInstallationParameters> = {
  clockFormat: '12h',
  selectedContentTypeIds: [],
  useCustomDefaults: false,
  defaultHours: cloneHours(DEFAULT_HOURS),
  managedFieldId: 'storeHours',
  managedFieldName: 'Operating hours',
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

  try {
    return JSON.stringify(error);
  } catch {
    return 'Failed to apply Operating Hours to the selected content types.';
  }
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

  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'VersionMismatch'
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

function ConfigScreen() {
  const sdk = useSDK<ConfigAppSDK<AppInstallationParameters>>();
  const [clockFormat, setClockFormat] = useState<ClockFormat>('12h');
  const [contentTypes, setContentTypes] = useState<ContentTypeWithJsonFields[]>([]);
  const [selectedContentTypeIds, setSelectedContentTypeIds] = useState<string[]>([]);
  const [managedFieldName, setManagedFieldName] = useState(
    DEFAULT_INSTALLATION_PARAMETERS.managedFieldName
  );
  const [useCustomDefaults, setUseCustomDefaults] = useState(false);
  const [defaultHours, setDefaultHours] = useState<HoursOfOperation>(cloneHours(DEFAULT_HOURS));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguration = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentParameters = (await sdk.app.getParameters()) ?? DEFAULT_INSTALLATION_PARAMETERS;
      const savedContentTypeIds = currentParameters.selectedContentTypeIds ?? [];
      const savedDefaultHours = normalizeHours(currentParameters.defaultHours, DEFAULT_HOURS);

      setClockFormat(currentParameters.clockFormat ?? '12h');
      setManagedFieldName(
        currentParameters.managedFieldName ?? DEFAULT_INSTALLATION_PARAMETERS.managedFieldName
      );
      setUseCustomDefaults(currentParameters.useCustomDefaults ?? false);
      setDefaultHours(savedDefaultHours);

      const response = (await sdk.cma.contentType.getMany({})) as {
        items?: Array<{
          name: string;
          sys: { id: string };
          fields?: Array<{ id: string; name: string; type: string }>;
        }>;
      };

      const availableContentTypes = await Promise.all(
        (response.items ?? []).map(async (contentType) => {
          const jsonFieldIds = (contentType.fields ?? [])
            .filter((field) => field.type === 'Object')
            .map((field) => field.id);

          const editorInterface = (await sdk.cma.editorInterface.get({
            contentTypeId: contentType.sys.id,
          })) as {
            controls?: Array<{
              fieldId: string;
              widgetId?: string;
              widgetNamespace?: string;
            }>;
          };

          const appAssignedToAnyField = (editorInterface.controls ?? []).some(
            (entry) => entry.widgetNamespace === 'app' && entry.widgetId === sdk.ids.app
          );

          return {
            id: contentType.sys.id,
            name: contentType.name,
            jsonFieldIds,
            fields: contentType.fields ?? [],
            initiallyAssigned:
              appAssignedToAnyField || savedContentTypeIds.includes(contentType.sys.id),
          };
        })
      );

      setContentTypes(
        availableContentTypes.map(({ initiallyAssigned, ...contentType }) => ({
          ...contentType,
        }))
      );
      setSelectedContentTypeIds(
        availableContentTypes
          .filter((contentType) => contentType.initiallyAssigned)
          .map((contentType) => contentType.id)
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

  const applyContentTypeAssignments = useCallback(
    async (configParameters: AppInstallationParameters) => {
      const assignedFields = await Promise.all(
        contentTypes.map(async (contentType) => {
          const assignApp = configParameters.selectedContentTypeIds?.includes(contentType.id);
          const contentTypeDetails = (await sdk.cma.contentType.get({
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

          const untouchedControls = (editorInterface.controls ?? []).filter((control) => {
            const isClosingTimeControl =
              control.widgetNamespace === 'app' && control.widgetId === sdk.ids.app;
            const targetsManagedField =
              managedField !== undefined && control.fieldId === managedField.id;

            return !isClosingTimeControl && !targetsManagedField;
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

          const nextEditorInterface = {
            ...editorInterface,
            controls: updatedControls,
          };

          try {
            await sdk.cma.editorInterface.update(
              { contentTypeId: contentType.id },
              nextEditorInterface as never
            );
          } catch (error) {
            if (!isVersionMismatchError(error)) {
              throw error;
            }

            editorInterface = await getEditorInterface();
            await sdk.cma.editorInterface.update({ contentTypeId: contentType.id }, {
              ...editorInterface,
              controls: updatedControls,
            } as never);
          }

          return {
            contentTypeId: contentType.id,
            fieldId: assignApp && managedField ? managedField.id : null,
          };
        })
      );

      return assignedFields.reduce<Record<string, string[]>>((acc, assignment) => {
        if (assignment.fieldId) {
          acc[assignment.contentTypeId] = [assignment.fieldId];
        } else {
          acc[assignment.contentTypeId] = [];
        }

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

    if (!managedFieldName.trim()) {
      sdk.notifier.error('Enter a field name for the JSON field to create.');
      return false;
    }

    const managedFieldId = slugifyFieldId(managedFieldName);
    const parameters = {
      clockFormat,
      selectedContentTypeIds,
      useCustomDefaults,
      defaultHours: useCustomDefaults ? normalizeHours(defaultHours) : undefined,
      managedFieldId,
      managedFieldName: managedFieldName.trim(),
    };

    try {
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
      const message = getConfigureErrorMessage(configureError);
      sdk.notifier.error(message);
      return false;
    }
  }, [
    applyContentTypeAssignments,
    clockFormat,
    contentTypes,
    defaultHours,
    managedFieldName,
    sdk,
    selectedContentTypeIds,
    useCustomDefaults,
  ]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [onConfigure, sdk]);

  const pickerOptions = useMemo(() => {
    return contentTypes
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((contentType) => ({
        id: contentType.id,
        name: contentType.name,
        jsonFieldCount: contentType.jsonFieldIds.length,
      }));
  }, [contentTypes]);

  const handleDefaultDayChange = useCallback((day: DayOfWeek, dayHours: DayHours) => {
    setDefaultHours((currentHours) => ({
      ...currentHours,
      [day]: dayHours,
    }));
  }, []);

  const handleCopyDefaultsToAll = useCallback((sourceDay: DayOfWeek) => {
    setDefaultHours((currentHours) => {
      const nextHours = cloneHours(currentHours);
      const sourceHours = currentHours[sourceDay];

      DAYS_OF_WEEK.forEach((day) => {
        nextHours[day] = {
          isOpen: sourceHours.isOpen,
          is24Hours: sourceHours.is24Hours,
          slots: sourceHours.slots.map((slot) => ({ ...slot })),
        };
      });

      return nextHours;
    });
  }, []);

  const handleCopyDefaultsToWeekdays = useCallback((sourceDay: DayOfWeek) => {
    setDefaultHours((currentHours) => {
      const nextHours = cloneHours(currentHours);
      const sourceHours = currentHours[sourceDay];

      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day) => {
        nextHours[day as DayOfWeek] = {
          isOpen: sourceHours.isOpen,
          is24Hours: sourceHours.is24Hours,
          slots: sourceHours.slots.map((slot) => ({ ...slot })),
        };
      });

      return nextHours;
    });
  }, []);

  if (isLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" padding="spacingXl">
        <Spinner />
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
    <Flex justifyContent="center" style={{ width: '100%' }}>
      <Box
        style={{
          width: '900px',
          maxWidth: '100%',
          padding: '48px 24px 64px',
        }}>
        <Form>
          <Stack
            flexDirection="column"
            spacing="spacingXl"
            alignItems="stretch"
            style={{ width: '100%', textAlign: 'left' }}>
            <Box style={{ width: '100%', maxWidth: '760px' }}>
              <Heading marginBottom="spacingS">Set up Operating Hours</Heading>
              <Paragraph marginBottom="none" style={{ maxWidth: '720px' }}>
                Configure what fields use Operating Hours and how hours of operation are displayed.
              </Paragraph>
            </Box>

            <Box style={{ width: '100%', maxWidth: '760px' }}>
              <Heading as="h2" marginBottom="spacingS">
                Assign content types
              </Heading>
              <Paragraph marginBottom="spacingM">
                Select the content type(s) you want to use with Operating Hours. You can change this
                anytime by navigating to the &quot;Fields&quot; tab in your content model and
                unassigning the app from the JSON field.
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
            </Box>

            <Box style={{ width: '100%', maxWidth: '760px' }}>
              <Heading as="h2" marginBottom="spacingS">
                Configure defaults
              </Heading>
              <Paragraph marginBottom="spacingM">
                Set the field name and choose how authors should see hours while editing content.
              </Paragraph>
              <Stack flexDirection="column" spacing="spacingM" alignItems="stretch">
                <FormControl>
                  <FormControl.Label>JSON field name</FormControl.Label>
                  <TextInput
                    value={managedFieldName}
                    onChange={(event) => setManagedFieldName(event.target.value)}
                    placeholder="Operating hours"
                  />
                  <FormControl.HelpText>
                    Operating Hours will create this JSON field on each selected content type if it
                    does not already exist.
                  </FormControl.HelpText>
                </FormControl>

                <FormControl>
                  <FormControl.Label>Time display format</FormControl.Label>
                  <Select
                    value={clockFormat}
                    onChange={(event) => setClockFormat(event.target.value as ClockFormat)}>
                    <Select.Option value="12h">12-hour clock</Select.Option>
                    <Select.Option value="24h">24-hour clock</Select.Option>
                  </Select>
                  <FormControl.HelpText>
                    Stored values stay in `HH:MM` JSON format. This sets the default display format,
                    and authors can change it for individual entries in the field app.
                  </FormControl.HelpText>
                </FormControl>
              </Stack>
            </Box>

            <Box style={{ width: '100%', maxWidth: '760px' }}>
              <Heading as="h2" marginBottom="spacingS">
                Default hours
              </Heading>
              <Paragraph marginBottom="spacingM">
                Choose whether Operating Hours should prefill each day with custom opening hours the
                first time authors open an empty field. If disabled, all days start closed.
              </Paragraph>
              <Flex alignItems="flex-start" gap="spacingM">
                <Switch
                  id="use-custom-defaults"
                  isChecked={useCustomDefaults}
                  onChange={() => setUseCustomDefaults((enabled) => !enabled)}
                />
                <Box>
                  <Paragraph marginBottom="none" style={{ fontWeight: 600 }}>
                    Set default hours before install
                  </Paragraph>
                  <Paragraph marginTop="none" marginBottom="none">
                    Enable default opening and closing hours for each day. If disabled, Operating
                    Hours starts with every day closed until authors add hours manually.
                  </Paragraph>
                </Box>
              </Flex>

              {useCustomDefaults && (
                <Box marginTop="spacingM">
                  <Paragraph marginBottom="spacingM">
                    Configure the initial hours authors should see the first time they open
                    Operating Hours on an empty field.
                  </Paragraph>
                  <Box
                    style={{
                      backgroundColor: '#f7f9fa',
                      border: '1px solid #d3dce6',
                      borderRadius: '6px',
                      padding: '16px',
                    }}>
                    <Stack
                      flexDirection="column"
                      spacing="spacingM"
                      alignItems="stretch"
                      style={{ width: '100%' }}>
                      {DAYS_OF_WEEK.map((day) => (
                        <DayRow
                          key={day}
                          day={day}
                          dayHours={defaultHours[day]}
                          onChange={(dayHours) => handleDefaultDayChange(day, dayHours)}
                          onCopyToAll={() => handleCopyDefaultsToAll(day)}
                          onCopyToWeekdays={() => handleCopyDefaultsToWeekdays(day)}
                          clockFormat={clockFormat}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>
              )}
            </Box>
          </Stack>
        </Form>
      </Box>
    </Flex>
  );
}

export default ConfigScreen;
