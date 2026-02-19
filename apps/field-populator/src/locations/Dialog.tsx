import { DialogAppSDK } from '@contentful/app-sdk';
import { Box, Button, Flex, Form, Skeleton } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { useEffect, useMemo, useState } from 'react';
import ConfirmationStep from '../components/steps/ConfirmationStep';
import LocaleSelectionStep from '../components/steps/LocaleSelectionStep';
import PreviewStep from '../components/steps/PreviewStep';
import { AdoptedFieldsMap, hasAnyAdoptedFields, ReferencedEntryData } from '../utils/adoptedFields';
import { SimplifiedLocale, mapLocaleNamesToSimplifiedLocales } from '../utils/locales';
import { updateEntries, UpdateResult } from '../utils/entry';
import { styles } from './Dialog.styles';
import { fetchEntries } from '../utils/entry';

type DialogStep = 'locale-selection' | 'preview' | 'confirmation';

interface InvocationParameters {
  entryId: string;
  contentTypeId: string;
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParams = sdk.parameters.invocation as unknown as InvocationParameters;

  const [currentStep, setCurrentStep] = useState<DialogStep>('locale-selection');

  const [selectedSourceLocale, setSelectedSourceLocale] = useState<string | undefined>(undefined);
  const [selectedTargetLocales, setSelectedTargetLocales] = useState<SimplifiedLocale[]>([]);
  const [missingSourceLocale, setMissingSourceLocale] = useState(false);
  const [missingTargetLocales, setMissingTargetLocales] = useState(false);

  const [entry, setEntry] = useState<EntryProps | null>(null);
  const [contentType, setContentType] = useState<ContentTypeProps | null>(null);
  const [referencedEntries, setReferencedEntries] = useState<ReferencedEntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adoptedFields, setAdoptedFields] = useState<AdoptedFieldsMap>({});

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);

  const mappedLocales = mapLocaleNamesToSimplifiedLocales(sdk.locales.names);

  useAutoResizer();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchEntries(
          sdk.cma,
          invocationParams.entryId,
          invocationParams.contentTypeId
        );
        setEntry(result.entry);
        setContentType(result.contentType);
        setReferencedEntries(result.referencedEntriesData);
      } catch (error) {
        console.error('Error fetching entry data:', error);
        setError('Failed to fetch entry data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sdk.cma, invocationParams.entryId, invocationParams.contentTypeId]);

  const handleNext = () => {
    if (!selectedSourceLocale || selectedTargetLocales.length === 0) {
      setMissingSourceLocale(!selectedSourceLocale);
      setMissingTargetLocales(selectedTargetLocales.length === 0);
      return;
    }
    setCurrentStep('preview');
  };

  const handleBack = () => {
    setCurrentStep('locale-selection');
  };

  const handleConfirm = async () => {
    if (!selectedSourceLocale || !entry) {
      return;
    }

    setIsUpdating(true);

    const result = await updateEntries(
      sdk.cma,
      invocationParams.entryId,
      selectedSourceLocale,
      selectedTargetLocales.map((locale) => locale.code),
      adoptedFields
    );

    setUpdateResult(result);
    setIsUpdating(false);
    setCurrentStep('confirmation');
  };

  const hasAdoptedFields = useMemo(() => {
    return hasAnyAdoptedFields(adoptedFields);
  }, [adoptedFields]);

  if (loading) {
    return (
      <Form>
        <Flex
          flexDirection="column"
          marginTop="spacingM"
          marginRight="spacingL"
          marginLeft="spacingL"
          marginBottom="spacingM"
          className={styles.container}>
          <Skeleton.Container>
            <Skeleton.BodyText numberOfLines={4} />
          </Skeleton.Container>
        </Flex>
      </Form>
    );
  }

  if (error || !entry || !contentType) {
    return (
      <Form>
        <Flex
          flexDirection="column"
          marginTop="spacingM"
          marginRight="spacingL"
          marginLeft="spacingL"
          marginBottom="spacingM"
          className={styles.container}>
          <Flex flexDirection="column" alignItems="center" gap="spacingM">
            {error || 'Failed to load entry data'}
          </Flex>
          <Flex justifyContent="flex-end" gap="spacingM" marginTop="spacingL">
            <Button onClick={() => sdk.close()}>Close</Button>
          </Flex>
        </Flex>
      </Form>
    );
  }

  return (
    <Form>
      <Flex
        flexDirection="column"
        justifyContent="space-between"
        marginTop="spacingM"
        marginRight="spacingL"
        marginLeft="spacingL"
        marginBottom="spacingM"
        className={styles.container}>
        {currentStep === 'locale-selection' && (
          <Box>
            <LocaleSelectionStep
              availableLocales={mappedLocales}
              selectedSourceLocale={selectedSourceLocale}
              selectedTargetLocales={selectedTargetLocales}
              onSourceLocaleChange={(locale) => {
                setSelectedSourceLocale(locale);
                setMissingSourceLocale(false);
              }}
              onTargetLocalesChange={(locales) => {
                setSelectedTargetLocales(locales);
                setMissingTargetLocales(false);
              }}
              missingSourceLocale={missingSourceLocale}
              missingTargetLocales={missingTargetLocales}
            />
            <Flex justifyContent="flex-end" gap="spacingM">
              <Button onClick={() => sdk.close()}>Cancel</Button>
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            </Flex>
          </Box>
        )}

        {currentStep === 'preview' && selectedSourceLocale && (
          <>
            <PreviewStep
              entry={entry}
              contentType={contentType}
              referencedEntries={referencedEntries}
              sourceLocale={selectedSourceLocale}
              targetLocales={selectedTargetLocales}
              adoptedFields={adoptedFields}
              onAdoptedFieldsChange={setAdoptedFields}
              availableLocales={mappedLocales}
              isDisabled={isUpdating}
              baseUrl={`https://${sdk.hostnames.webapp}/spaces/${sdk.ids.space}/environments/${sdk.ids.environment}`}
            />
            <Flex justifyContent="flex-end" gap="spacingM" className={styles.stickyFooter}>
              <Button onClick={handleBack} isDisabled={isUpdating}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                isDisabled={!hasAdoptedFields || isUpdating}
                isLoading={isUpdating}>
                Confirm
              </Button>
            </Flex>
          </>
        )}

        {currentStep === 'confirmation' && updateResult && (
          <>
            <ConfirmationStep result={updateResult} />
            <Flex justifyContent="flex-end" gap="spacingM">
              <Button variant="primary" onClick={() => sdk.close()}>
                Done
              </Button>
            </Flex>
          </>
        )}
      </Flex>
    </Form>
  );
};

export default Dialog;
