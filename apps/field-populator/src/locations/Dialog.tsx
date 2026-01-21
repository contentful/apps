import { DialogAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Form, FormControl, Select } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import LocaleMultiSelect from '../components/LocaleMultiSelect';
import {
  SimplifiedLocale,
  mapLocaleNamesToSimplifiedLocales,
  normalizeLocaleCode,
} from '../utils/locales';
import { styles } from './Dialog.styles';

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
        <Flex flexDirection="column">
          <FormControl isRequired isInvalid={missingSourceLocale}>
            <FormControl.Label>Select source locale</FormControl.Label>
            <Select
              id="source-locale"
              name="source-locale"
              testId="source-locale-select"
              onChange={(event) => setSelectedSourceLocale(event.target.value)}>
              {!selectedSourceLocale && (
                <Select.Option key={`select-locale-empty`} value={undefined}>
                  Select one
                </Select.Option>
              )}
              {mappedLocales.map((locale) => (
                <Select.Option
                  key={`select-locale-${normalizeLocaleCode(locale.code)}`}
                  data-test-id={`select-locale-${normalizeLocaleCode(locale.code)}`}
                  value={locale.code}>
                  {locale.name}
                </Select.Option>
              ))}
            </Select>
            {missingSourceLocale && (
              <FormControl.ValidationMessage>Select source locale</FormControl.ValidationMessage>
            )}
          </FormControl>
          <FormControl isRequired isInvalid={missingTargetLocales}>
            <FormControl.Label>Select target locales to populate</FormControl.Label>
            <LocaleMultiSelect
              availableLocales={mappedLocales}
              selectedLocales={selectedTargetLocales}
              onSelectionChange={setSelectedTargetLocales}
              isInvalid={missingTargetLocales}
            />
            {missingTargetLocales && (
              <FormControl.ValidationMessage>Select target locales</FormControl.ValidationMessage>
            )}
          </FormControl>
        </Flex>
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
