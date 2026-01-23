import { DialogAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Form } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import { SimplifiedLocale, mapLocaleNamesToSimplifiedLocales } from '../utils/locales';
import { styles } from './Dialog.styles';
import LocaleSelection from '../components/LocaleSelection';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const [selectedSourceLocale, setSelectedSourceLocale] = useState<string | null>(null);
  const [selectedTargetLocales, setSelectedTargetLocales] = useState<SimplifiedLocale[]>([]);
  const [missingSourceLocale, setMissingSourceLocale] = useState(false);
  const [missingTargetLocales, setMissingTargetLocales] = useState(false);

  const mappedLocales = mapLocaleNamesToSimplifiedLocales(sdk.locales.names);

  useAutoResizer();

  const handlePopulateFields = () => {
    if (!selectedSourceLocale || selectedTargetLocales.length === 0) {
      setMissingSourceLocale(!selectedSourceLocale);
      setMissingTargetLocales(selectedTargetLocales.length === 0);
      return;
    }

    sdk.close({
      sourceLocale: selectedSourceLocale,
      targetLocales: selectedTargetLocales.map((locale) => locale.code),
    });
  };

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
        <LocaleSelection
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
          <Button
            onClick={() => {
              sdk.close();
            }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handlePopulateFields()}>
            Populate fields
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
};

export default Dialog;
