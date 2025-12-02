import { FieldAppSDK } from '@contentful/app-sdk';
import { Box, Button, ButtonGroup, Flex, IconButton } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ArrowCounterClockwiseIcon } from '@contentful/f36-icons';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { useEffect, useState } from 'react';
import { styles } from './Field.styles';
import { AppInstallationParameters } from '../utils/types';
import { EntryProps } from 'contentful-management';
import { getFieldIdForContentType } from '../utils/fieldUtils';
import { delay, MAX_RETRIES } from '../utils/delay';
import { isEntryRecentlyCreated } from '../utils/entryUtils';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [isUpdating, setIsUpdating] = useState(true);
  const locales = sdk.locales;
  const defaultLocale = locales.default;
  const currentLocale = sdk.field.locale || defaultLocale;
  const installationParameters = sdk.parameters.installation as AppInstallationParameters;
  useAutoResizer();

  const getInternalNameFromParentEntry = (parentEntry: EntryProps): string => {
    const contentTypeId = sdk.contentType.sys.id;
    const fieldId = getFieldIdForContentType(contentTypeId, installationParameters);
    const separator = installationParameters.separator;

    const localizedFieldValue = parentEntry.fields[fieldId] as Record<string, string> | undefined;
    const parentFieldValue = localizedFieldValue?.[currentLocale] || '';

    if (!parentFieldValue) {
      return '';
    }

    return separator ? `${parentFieldValue} ${separator}` : parentFieldValue;
  };

  const findParentEntry = async (): Promise<EntryProps | null> => {
    const currentEntryId = sdk.ids.entry;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const entries = await sdk.cma.entry.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          query: {
            links_to_entry: currentEntryId,
            include: 1,
          },
        });

        if (entries.items.length > 0) {
          return entries.items[0];
        }

        if (attempt < MAX_RETRIES) {
          await delay(attempt);
        }
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          throw error;
        }
      }
    }

    return null;
  };

  const handleRefetch = async () => {
    setIsUpdating(true);

    try {
      const parentEntry = await findParentEntry();

      if (parentEntry) {
        const internalNameValue = getInternalNameFromParentEntry(parentEntry);
        await sdk.field.setValue(internalNameValue);
      }
    } catch (err: unknown) {
      console.error('Error updating internal name:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClear = async () => {
    await sdk.field.setValue('');
  };

  useEffect(() => {
    const updateInternalName = async () => {
      const entry = sdk.entry.getSys();
      const isRecent = isEntryRecentlyCreated(entry.createdAt);

      if (!sdk.field.getValue() && isRecent) {
        try {
          setIsUpdating(true);
          const parentEntry = await findParentEntry();

          if (parentEntry) {
            const internalNameValue = getInternalNameFromParentEntry(parentEntry);
            await sdk.field.setValue(internalNameValue);
          }
        } catch (err: unknown) {
          console.error('Error auto-updating internal name:', err);
        }
      }
    };

    updateInternalName().finally(() => {
      setIsUpdating(false);
    });
  }, []);

  return (
    <Flex marginBottom="none" fullWidth flexDirection="column">
      <Flex marginBottom="none" fullWidth>
        <Box marginRight="spacingS" className={styles.editor}>
          <SingleLineEditor
            field={sdk.field}
            locales={locales}
            withCharValidation
            isDisabled={isUpdating}
          />
        </Box>
        <Flex alignItems="flex-start">
          <ButtonGroup variant="spaced" spacing="spacingS">
            <IconButton
              variant="secondary"
              aria-label="Refetch value from parent"
              title="Refetch value from parent"
              icon={<ArrowCounterClockwiseIcon />}
              onClick={handleRefetch}
              isLoading={isUpdating}
            />
            <Button
              variant="negative"
              aria-label="Clear value"
              title="Clear value"
              onClick={handleClear}
              isDisabled={isUpdating}>
              Clear
            </Button>
          </ButtonGroup>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Field;
