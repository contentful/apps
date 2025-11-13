import { FieldAppSDK } from '@contentful/app-sdk';
import { Box, Button, ButtonGroup, Flex, IconButton, Skeleton } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ArrowCounterClockwiseIcon } from '@contentful/f36-icons';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { useEffect, useState } from 'react';
import { styles } from './Field.styles';
import { determineField } from '../utils/determineField';
import { AppInstallationParameters } from '../utils/types';
import { EntryProps } from 'contentful-management';

const MAX_RETRIES = 4;
const INITIAL_DELAY_MS = 500;
const MAX_DELAY_MS = 2000;

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useAutoResizer();
  const locales = sdk.locales;
  const defaultLocale = locales.default || 'en-US';
  const installationParameters = sdk.parameters.installation as AppInstallationParameters;

  const getInternalNameFromParentEntry = (parentEntry: EntryProps): string => {
    const contentTypeId = sdk.contentType.sys.id;
    const fieldId = determineField(contentTypeId, installationParameters);
    const separator = installationParameters.separator;
    const parentFieldValue = (parentEntry.fields[fieldId]?.[defaultLocale] as string) || '';

    return separator ? `${parentFieldValue} ${separator}` : parentFieldValue;
  };

  const findParentEntry = async (): Promise<EntryProps | null> => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
          const delayMs = Math.min(INITIAL_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
          await delay(delayMs);
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
    setError(null);

    try {
      const parentEntry = await findParentEntry();

      if (parentEntry) {
        const internalNameValue = getInternalNameFromParentEntry(parentEntry);
        await sdk.field.setValue(internalNameValue);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update internal name';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClear = async () => {
    await sdk.field.setValue('');
    setError(null);
  };

  const isEntryRecentlyCreated = () => {
    const entry = sdk.entry.getSys();
    const createdAt = new Date(entry.createdAt);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const secondsDiff = timeDiff / 1000;

    // Consider entry "recent" if created within the last 30 seconds
    return secondsDiff < 30;
  };

  useEffect(() => {
    const updateInternalName = async () => {
      const parentEntry = await findParentEntry();
      const isRecent = isEntryRecentlyCreated();

      if (parentEntry && !sdk.field.getValue() && isRecent) {
        setIsUpdating(true);

        try {
          const internalNameValue = getInternalNameFromParentEntry(parentEntry);
          await sdk.field.setValue(internalNameValue);
        } catch (err: any) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to update internal name';
          setError(errorMessage);
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
          <SingleLineEditor field={sdk.field} locales={locales} withCharValidation />
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
      {error && (
        <Box marginTop="spacingXs" fontSize="fontSizeS" css={styles.error}>
          {error}
        </Box>
      )}
    </Flex>
  );
};

export default Field;
