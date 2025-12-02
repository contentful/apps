import { DialogAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Form, FormControl, Select } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import LocaleMultiSelect from '../components/LocaleMultiSelect';
import { SimplifiedLocale, mapLocaleNamesToSimplifiedLocales } from '../utils/locales';
import { styles } from './Dialog.styles';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const [selectedSourceLocale, setSelectedSourceLocale] = useState<string | null>(null);
  const [selectedTargetLocales, setSelectedTargetLocales] = useState<SimplifiedLocale[]>([]);
  const [missingInputs, setMissingInputs] = useState<{
    missingSourceLocale: boolean;
    missingTargetLocales: boolean;
  }>({ missingSourceLocale: false, missingTargetLocales: false });

  const mappedLocales = mapLocaleNamesToSimplifiedLocales(sdk.locales.names);

  useAutoResizer();

  const normalizeCode = (code: string) => {
    return code.toLowerCase().replace(/\s/g, '-');
  };

  const handlePopulateFields = () => {
    if (!selectedSourceLocale || selectedTargetLocales.length === 0) {
      setMissingInputs({
        missingSourceLocale: !selectedSourceLocale,
        missingTargetLocales: selectedTargetLocales.length === 0,
      });
      return;
    }

    // todo : copy and paste logic to populate fields

    sdk.close();
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
          <FormControl isRequired isInvalid={missingInputs.missingSourceLocale}>
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
                  key={`select-locale-${normalizeCode(locale.code)}`}
                  data-test-id={`select-locale-${normalizeCode(locale.code)}`}
                  value={locale.code}>
                  {locale.name}
                </Select.Option>
              ))}
            </Select>
            {missingInputs.missingSourceLocale && (
              <FormControl.ValidationMessage>Select source locale</FormControl.ValidationMessage>
            )}
          </FormControl>
          <FormControl isRequired isInvalid={missingInputs.missingTargetLocales}>
            <FormControl.Label>Select target locales to populate</FormControl.Label>
            <LocaleMultiSelect
              availableLocales={mappedLocales}
              selectedLocales={selectedTargetLocales}
              onSelectionChange={setSelectedTargetLocales}
              isInvalid={missingInputs.missingTargetLocales}
            />
            {missingInputs.missingTargetLocales && (
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
