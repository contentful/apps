import { FieldAppSDK } from '@contentful/app-sdk';
import { Box, Button, ButtonGroup, Flex, IconButton } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ArrowCounterClockwiseIcon } from '@contentful/f36-icons';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { useEffect, useState } from 'react';
import { styles } from './Field.styles';
import { EntryProps } from 'contentful-management';
import { AppInstallationParameters, Rule } from '../utils/types';
import { getMatchingRule } from '../utils/utils';
import { delay, MAX_RETRIES } from '../utils/delay';
import { isEntryRecentlyCreated } from '../utils/utils';
import { useInstallationParameters } from '../hooks/useInstallationParameters';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [isUpdating, setIsUpdating] = useState(true);
  const installationParameters = useInstallationParameters(sdk) as AppInstallationParameters;
  const matchingRule = getMatchingRule(
    sdk.contentType.sys.id,
    sdk.ids.field,
    installationParameters
  );
  const locales = sdk.locales;
  const defaultLocale = locales.default;
  const currentLocale = sdk.field.locale || defaultLocale;
  useAutoResizer();

  const getInternalNameFromParentEntry = (parentEntry: EntryProps, fieldId: string): string => {
    const localizedFieldValue = parentEntry.fields[fieldId];
    const parentFieldValue = localizedFieldValue?.[currentLocale];

    if (!parentFieldValue) {
      return '';
    }

    const separator = installationParameters.separator;
    return separator ? `${parentFieldValue} ${separator}` : parentFieldValue;
  };

  const findParentEntry = async (matchingRule: Rule): Promise<EntryProps | null> => {
    const currentEntryId = sdk.ids.entry;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const entries = await sdk.cma.entry.getMany({
          query: {
            links_to_entry: currentEntryId,
            content_type: matchingRule.parentField.contentTypeId,
            select: `fields.${matchingRule.parentField.fieldId}`,
            order: '-sys.updatedAt',
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
    if (!matchingRule) {
      return;
    }
    setIsUpdating(true);

    try {
      const parentEntry = await findParentEntry(matchingRule);

      if (parentEntry) {
        const internalNameValue = getInternalNameFromParentEntry(
          parentEntry,
          matchingRule.parentField.fieldId
        );
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

      if (!sdk.field.getValue() && !!matchingRule && isRecent) {
        try {
          setIsUpdating(true);
          const parentEntry = await findParentEntry(matchingRule);

          if (parentEntry) {
            const internalNameValue = getInternalNameFromParentEntry(
              parentEntry,
              matchingRule.parentField.fieldId
            );
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
